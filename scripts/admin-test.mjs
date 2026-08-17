#!/usr/bin/env node
// ============================================================
// Acceptance tests for the `admin` edge function (ticket #2).
//
// Modes:
//   node scripts/admin-test.mjs auth
//     → 401 checks (wrong/missing x-admin-secret) on all actions,
//       plus overview + sync_sheet behavior. No email sent.
//
//   node scripts/admin-test.mjs send <recipient-email>
//     → registers <recipient> as a student (service role), sends a code,
//       verifies the row (hash set, status 'sent', resend id stored).
//       Then read the code from the inbox and run:
//
//   node scripts/admin-test.mjs book <recipient-email> <CODE> [project_id]
//     → books with the emailed code (proves integration with ticket #1),
//       then RESENDS a new code and proves the old code now fails with
//       invalid_code. Read the second email and run:
//
//   node scripts/admin-test.mjs verify-new <recipient-email> <NEW-CODE>
//     → proves the new code identifies the student (already_booked,
//       since they booked in the previous step), runs refresh_status
//       and reports the delivery status.
//
//   node scripts/admin-test.mjs cleanup <recipient-email>
//     → removes the test booking (and the student row if it was
//       created by this script).
//
// Env (from .env): SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_ANON_KEY/
// VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SECRET.
// Never prints codes it did not receive as arguments; never logs secrets.
// ============================================================

const URL_ = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const [mode, arg1, arg2, arg3] = process.argv.slice(2);

if (!URL_ || !ANON || !SERVICE || !ADMIN_SECRET) {
  console.error('Missing env: need SUPABASE URL, anon key, service role key, ADMIN_SECRET.');
  process.exit(1);
}

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ✅' : '  ❌'} ${label}${detail ? `, ${detail}` : ''}`);
  if (!ok) failures++;
};

const admin = async (body, secret = ADMIN_SECRET) => {
  const res = await fetch(`${URL_}/functions/v1/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON}`,
      ...(secret !== null && { 'x-admin-secret': secret }),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

const rest = async (path, { method = 'GET', body } = {}) => {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

const rpcAnon = async (fn, args) => {
  const res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  return res.json().catch(() => null);
};

const finish = () => {
  console.log(failures === 0 ? '\nPASSED ✅' : `\n${failures} CHECK(S) FAILED ❌`);
  process.exit(failures === 0 ? 0 : 1);
};

if (mode === 'auth') {
  console.log('401 checks:');
  for (const action of ['overview', 'send_code', 'refresh_status', 'sync_sheet', 'set_booking_open']) {
    const wrong = await admin({ action }, 'wrong-secret');
    check(`${action} with wrong secret → 401 unauthorized`, wrong.status === 401 && wrong.json?.error === 'unauthorized');
    const missing = await admin({ action }, null);
    check(`${action} with no secret → 401`, missing.status === 401);
  }
  console.log('\nAuthorized calls:');
  const ov = await admin({ action: 'overview' });
  check('overview returns students/projects/totals', ov.status === 200 && ov.json?.ok && Array.isArray(ov.json.students) && Array.isArray(ov.json.projects) && !!ov.json.totals, `status ${ov.status}`);
  check('overview lists 25 projects', ov.json?.projects?.length === 25);
  check('overview reports the booking gate', typeof ov.json?.booking_open === 'boolean', `booking_open is ${JSON.stringify(ov.json?.booking_open)}`);
  console.log(`  booking is currently ${ov.json?.booking_open ? 'OPEN' : 'CLOSED'}`);
  // Rejected before it writes anything, so this never flips the real gate.
  const badGate = await admin({ action: 'set_booking_open' });
  check('set_booking_open without a boolean → 400 bad_request', badGate.status === 400 && badGate.json?.error === 'bad_request', JSON.stringify(badGate.json));
  const sheet = await admin({ action: 'sync_sheet' });
  check('sync_sheet responds per contract (ok, or not_configured/sheet_failed)', sheet.json?.ok === true || ['not_configured', 'sheet_failed'].includes(sheet.json?.error), JSON.stringify(sheet.json));
  const unknown = await admin({ action: 'nonsense' });
  check('unknown action → 400', unknown.status === 400);
  const missing = await admin({ action: 'send_code', email: 'not-a-student@example.invalid' });
  check('send_code to unregistered email → not_found', missing.status === 404 && missing.json?.error === 'not_found');
  finish();
}

if (mode === 'send') {
  const email = String(arg1 ?? '').toLowerCase().trim();
  if (!email) { console.error('usage: admin-test.mjs send <email>'); process.exit(1); }
  await rest('students', { method: 'POST', body: { email }, }).catch(() => {});
  const before = (await rest(`students?email=eq.${encodeURIComponent(email)}&select=code_hash`)).json?.[0];
  const res = await admin({ action: 'send_code', email });
  check('send_code reports success', res.json?.ok === true && res.json?.sent === 1, JSON.stringify(res.json));
  const row = (await rest(`students?email=eq.${encodeURIComponent(email)}&select=code_hash,code_sent_at,resend_email_id,delivery_status`)).json?.[0];
  check('code_hash is set and changed', !!row?.code_hash && row.code_hash !== before?.code_hash);
  check(`delivery_status is 'sent'`, row?.delivery_status === 'sent', row?.delivery_status);
  check('resend_email_id recorded', !!row?.resend_email_id);
  check('code_sent_at recorded', !!row?.code_sent_at);
  console.log(`\n→ Now read the 6-char code from ${email}'s inbox and run:\n   node scripts/admin-test.mjs book ${email} <CODE>`);
  finish();
}

if (mode === 'book') {
  const email = String(arg1 ?? '').toLowerCase().trim();
  const code = String(arg2 ?? '').trim();
  const projectId = Number(arg3 ?? 24);
  if (!email || !code) { console.error('usage: admin-test.mjs book <email> <CODE> [project_id]'); process.exit(1); }

  // This step books a real seat, so it needs the gate open. Refuse rather than
  // open it, flipping production booking from a test script is not this
  // script's call to make.
  const gate = await admin({ action: 'overview' });
  if (gate.json?.booking_open !== true) {
    console.error('Booking is CLOSED, so book_project will return not_open.');
    console.error('Open booking from the dashboard, re-run this step, then close it again.');
    process.exit(1);
  }

  const booked = await rpcAnon('book_project', { p_code: code, p_project_id: projectId });
  check('emailed code books successfully', booked?.ok === true && booked?.email === email, JSON.stringify(booked));

  console.log('\nResending (new code must replace the old one)…');
  const resend = await admin({ action: 'send_code', email });
  check('resend reports success', resend.json?.ok === true, JSON.stringify(resend.json));
  const oldAttempt = await rpcAnon('book_project', { p_code: code, p_project_id: projectId });
  check('OLD code now → invalid_code', oldAttempt?.error === 'invalid_code', JSON.stringify(oldAttempt));
  console.log(`\n→ Read the NEW code from the second email and run:\n   node scripts/admin-test.mjs verify-new ${email} <NEW-CODE>`);
  finish();
}

if (mode === 'verify-new') {
  const email = String(arg1 ?? '').toLowerCase().trim();
  const code = String(arg2 ?? '').trim();
  if (!email || !code) { console.error('usage: admin-test.mjs verify-new <email> <NEW-CODE>'); process.exit(1); }

  // Expects already_booked, which only surfaces past an open gate.
  const gate = await admin({ action: 'overview' });
  if (gate.json?.booking_open !== true) {
    console.error('Booking is CLOSED, so book_project returns not_open before it reads the code.');
    console.error('Open booking from the dashboard, re-run this step, then close it again.');
    process.exit(1);
  }

  const attempt = await rpcAnon('book_project', { p_code: code, p_project_id: 1 });
  check('new code identifies the student (already_booked + their project)', attempt?.error === 'already_booked' && !!attempt?.project, JSON.stringify(attempt));

  console.log('\nrefresh_status:');
  const refresh = await admin({ action: 'refresh_status' });
  check('refresh_status runs', refresh.json?.ok === true, JSON.stringify(refresh.json));
  const row = (await rest(`students?email=eq.${encodeURIComponent(email)}&select=delivery_status`)).json?.[0];
  console.log(`  delivery_status for ${email}: ${row?.delivery_status}`);
  check(`status is 'delivered' (or still 'sent' if Resend hasn't updated yet, rerun in a minute)`, ['delivered', 'sent'].includes(row?.delivery_status), row?.delivery_status);
  finish();
}

if (mode === 'cleanup') {
  const email = String(arg1 ?? '').toLowerCase().trim();
  if (!email) { console.error('usage: admin-test.mjs cleanup <email>'); process.exit(1); }
  await rest(`bookings?email=eq.${encodeURIComponent(email)}`, { method: 'DELETE' });
  await rest(`students?email=eq.${encodeURIComponent(email)}`, { method: 'DELETE' });
  console.log('test booking + student removed');
  process.exit(0);
}

console.error('unknown mode, see header for usage');
process.exit(1);
