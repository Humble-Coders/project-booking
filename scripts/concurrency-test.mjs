#!/usr/bin/env node
// ============================================================
// Concurrency test for book_project (ticket #1 acceptance).
//
// Seeds 15 throwaway students (hashed codes) with the service
// role, fires 15 PARALLEL book_project RPCs at one project as
// anon, and asserts: exactly 10 ok, 5 full, bookings == 10,
// seat_counts.booked == 10. Also spot-checks already_booked,
// invalid_code and no_project. Cleans up all test rows after,
// pass or fail.
//
// Usage:
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_ANON_KEY=<anon/publishable key> \
//   SUPABASE_SERVICE_ROLE_KEY=<service role key> \
//   node scripts/concurrency-test.mjs [project_id]
//
// project_id defaults to 25; pick any project with 0 real
// bookings — the test needs all 10 seats free.
// ============================================================

import { createHash } from 'node:crypto';

const URL_ = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_ID = Number(process.argv[2] ?? 25);
const N = 15;

if (!URL_ || !ANON || !SERVICE) {
  console.error('Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (see header).');
  process.exit(1);
}

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// Code alphabet per PRD: A-Z + 2-9 minus O/I (no 0/1 lookalikes).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () =>
  Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

async function rest(path, { method = 'GET', key, body, headers = {} } = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON error body */ }
  return { status: res.status, json, text };
}

const rpc = (fn, args, key = ANON) => rest(`rpc/${fn}`, { method: 'POST', key, body: args });

const students = Array.from({ length: N }, (_, i) => ({
  email: `concurrency-test+${i}@example.invalid`,
  code: makeCode(),
}));

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ✅' : '  ❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

async function cleanup() {
  await rest(`bookings?email=like.concurrency-test%2B*`, { method: 'DELETE', key: SERVICE });
  await rest(`students?email=like.concurrency-test%2B*`, { method: 'DELETE', key: SERVICE });
}

try {
  console.log(`Target project ${PROJECT_ID} — checking it has all 10 seats free…`);
  const pre = await rest(`seat_counts?project_id=eq.${PROJECT_ID}&select=booked`, { key: SERVICE });
  const preBooked = pre.json?.[0]?.booked ?? 0;
  if (preBooked !== 0) {
    console.error(`Project ${PROJECT_ID} already has ${preBooked} booking(s). Pick an empty one.`);
    process.exit(1);
  }

  console.log(`Seeding ${N} test students (service role, hashed codes)…`);
  await cleanup(); // clear any leftovers from an aborted run
  const seed = await rest('students', {
    method: 'POST',
    key: SERVICE,
    body: students.map((s) => ({ email: s.email, code_hash: sha256(s.code) })),
    headers: { Prefer: 'return=minimal' },
  });
  if (seed.status >= 300) {
    console.error('Seeding failed:', seed.status, seed.text);
    process.exit(1);
  }

  console.log(`Firing ${N} parallel book_project calls (anon key)…`);
  const results = await Promise.all(
    students.map((s) => rpc('book_project', { p_code: s.code.toLowerCase(), p_project_id: PROJECT_ID }))
  );
  const bodies = results.map((r) => r.json);
  const okCount = bodies.filter((b) => b?.ok === true).length;
  const fullCount = bodies.filter((b) => b?.error === 'full').length;
  const otherCount = N - okCount - fullCount;

  console.log('\nRace results:');
  check(`exactly 10 succeeded`, okCount === 10, `got ${okCount}`);
  check(`exactly 5 got 'full'`, fullCount === 5, `got ${fullCount}`);
  check(`no other outcomes`, otherCount === 0, otherCount ? JSON.stringify(bodies.filter((b) => b?.ok !== true && b?.error !== 'full')) : '');
  check(`success payload has email + project`, bodies.filter((b) => b?.ok).every((b) => b.email && b.project));

  const booked = await rest(`bookings?project_id=eq.${PROJECT_ID}&select=email`, { key: SERVICE });
  check(`bookings table has exactly 10 rows`, booked.json?.length === 10, `got ${booked.json?.length}`);
  const sc = await rest(`seat_counts?project_id=eq.${PROJECT_ID}&select=booked`, { key: SERVICE });
  check(`seat_counts.booked is exactly 10`, sc.json?.[0]?.booked === 10, `got ${sc.json?.[0]?.booked}`);

  console.log('\nError contract:');
  const winner = students[bodies.findIndex((b) => b?.ok === true)];
  const again = await rpc('book_project', { p_code: winner.code, p_project_id: PROJECT_ID });
  check(`second attempt → already_booked + project`, again.json?.error === 'already_booked' && !!again.json?.project, JSON.stringify(again.json));
  const garbage = await rpc('book_project', { p_code: 'XXXXXX', p_project_id: PROJECT_ID });
  check(`garbage code → invalid_code`, garbage.json?.error === 'invalid_code', JSON.stringify(garbage.json));
  const loser = students[bodies.findIndex((b) => b?.error === 'full')];
  const noProj = await rpc('book_project', { p_code: loser.code, p_project_id: 9999 });
  check(`nonexistent project → no_project`, noProj.json?.error === 'no_project', JSON.stringify(noProj.json));

  console.log('\nRLS lockdown (anon REST):');
  for (const table of ['students', 'bookings', 'projects']) {
    const r = await rest(`${table}?select=*&limit=1`, { key: ANON });
    check(`anon read on ${table} returns no data`, r.status >= 400 || (Array.isArray(r.json) && r.json.length === 0), `status ${r.status}`);
  }
  const scAnon = await rest(`seat_counts?select=*&limit=1`, { key: ANON });
  check(`anon read on seat_counts works`, scAnon.status === 200 && Array.isArray(scAnon.json), `status ${scAnon.status}`);
  const scWrite = await rest(`seat_counts?project_id=eq.${PROJECT_ID}`, { method: 'PATCH', key: ANON, body: { booked: 0 } });
  const scAfter = await rest(`seat_counts?project_id=eq.${PROJECT_ID}&select=booked`, { key: SERVICE });
  check(`anon cannot write seat_counts`, scAfter.json?.[0]?.booked === 10, `status ${scWrite.status}, booked now ${scAfter.json?.[0]?.booked}`);

  console.log('\nget_projects agreement:');
  const gp = await rpc('get_projects', {});
  const proj = gp.json?.find?.((p) => p.id === PROJECT_ID);
  check(`seats_left reflects the 10 bookings`, proj && proj.seats_left === proj.capacity - 10, `seats_left ${proj?.seats_left}`);
} finally {
  console.log('\nCleaning up test rows…');
  await cleanup();
}

console.log(failures === 0 ? '\nALL CHECKS PASSED ✅' : `\n${failures} CHECK(S) FAILED ❌`);
process.exit(failures === 0 ? 0 : 1);
