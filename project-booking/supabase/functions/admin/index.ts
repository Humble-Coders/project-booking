// admin — the single instructor surface (PRD §5.3–5.4). POST JSON {action, ...},
// gated by the x-admin-secret header. Actions:
//   overview       → students + per-project bookings + totals
//   send_code      → {email} or {all_pending:true}: fresh code, hash overwritten
//                    (old code dies instantly), emailed via Resend, id tracked
//   refresh_status → poll Resend per tracked email id → delivered/bounced/failed
//   sync_sheet     → upsert registered emails from the published Google Sheet CSV
//
// Error contract: unauthorized | not_found | resend_failed | sheet_failed
//                 (+ not_configured when SHEET_CSV_URL is unset)
//
// Secrets (supabase secrets set): ADMIN_SECRET, RESEND_API_KEY, FROM_EMAIL,
// SHEET_CSV_URL, SYNC_SECRET (used by sync-students, set alongside).
// Plaintext codes exist ONLY inside the outgoing email — never logged or stored.

import { createClient } from "npm:@supabase/supabase-js@2";
import { syncSheet } from "../_shared/sheet.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// Booking-code alphabet per PRD §4: A–Z + 2–9, minus O/I (0/1 lookalikes).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SITE_URL = "https://projects.humblecoders.in";

function codeEmailHtml(code: string): string {
  return `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:440px;margin:0 auto;padding:32px 24px;background:#07090f;border-radius:14px;color:#f4f6fb">
    <p style="margin:0 0 4px;font-size:14px;color:#94a0b8">Humble Coders — Project Booking</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#ffffff">Your personal booking code</h1>
    <div style="font-size:36px;letter-spacing:10px;font-weight:800;color:#5b7cc4;padding:16px 0">${code}</div>
    <p style="font-size:14px;color:#f4f6fb;margin:16px 0 0">Pick your project at
      <a href="${SITE_URL}" style="color:#f5c451">${SITE_URL.replace("https://", "")}</a>
      and enter this code to book your seat.</p>
    <p style="font-size:13px;color:#94a0b8;margin:16px 0 0">Keep it to yourself — this code is your identity. If you lose it, ask your instructor for a new one (the old one stops working).</p>
  </div>`;
}

type SendOutcome = { email: string; ok: boolean; error?: string; quota_hint?: boolean };

// Send one code: generate → hash into the row FIRST (old code dies even if the
// email then fails — instructor just resends) → email → record Resend id.
async function sendCodeTo(db: ReturnType<typeof createClient>, email: string): Promise<SendOutcome> {
  // Regenerate on the (astronomically rare) unique-hash collision.
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode();
    const { error } = await db
      .from("students")
      .update({
        code_hash: await sha256Hex(code),
        code_sent_at: new Date().toISOString(),
        resend_email_id: null,
        delivery_status: "sent",
      })
      .eq("email", email);
    if (!error) break;
    if (attempt === 4) return { email, ok: false, error: error.message };
    if (!error.message.includes("students_code_hash_key")) return { email, ok: false, error: error.message };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("FROM_EMAIL") ?? "Humble Coders <onboarding@resend.dev>",
      to: [email],
      subject: "Your Humble Coders booking code",
      html: codeEmailHtml(code),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    await db.from("students").update({ delivery_status: "failed" }).eq("email", email);
    const quota = res.status === 429 || /quota|limit/i.test(detail);
    // detail comes from Resend, never contains the code
    return { email, ok: false, error: "resend_failed", quota_hint: quota };
  }

  const { id } = await res.json();
  await db.from("students").update({ resend_email_id: id }).eq("email", email);
  return { email, ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== Deno.env.get("ADMIN_SECRET")) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  const action = String(body.action ?? "");

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (action === "overview") {
    const [{ data: students }, { data: bookings }, { data: projects }] = await Promise.all([
      db.from("students").select("email, code_sent_at, delivery_status").order("email"),
      db.from("bookings").select("email, project_id, booked_at"),
      db.from("projects").select("id, title, capacity").order("id"),
    ]);
    const byEmail = new Map((bookings ?? []).map((b) => [b.email, b.project_id]));
    const titles = new Map((projects ?? []).map((p) => [p.id, p.title]));
    const studentRows = (students ?? []).map((s) => ({
      ...s,
      project_id: byEmail.get(s.email) ?? null,
      project: titles.get(byEmail.get(s.email) ?? -1) ?? null,
    }));
    const projectRows = (projects ?? []).map((p) => ({
      ...p,
      booked: (bookings ?? []).filter((b) => b.project_id === p.id).map((b) => b.email).sort(),
    }));
    return json({
      ok: true,
      students: studentRows,
      projects: projectRows,
      totals: {
        students: studentRows.length,
        booked: byEmail.size,
        unbooked: studentRows.length - byEmail.size,
        delivered: studentRows.filter((s) => s.delivery_status === "delivered").length,
      },
    });
  }

  if (action === "send_code") {
    let targets: string[];
    if (body.all_pending === true) {
      const { data } = await db.from("students").select("email").is("code_hash", null).order("email");
      targets = (data ?? []).map((s) => s.email);
    } else {
      const email = String(body.email ?? "").toLowerCase().trim();
      const { data } = await db.from("students").select("email").eq("email", email).maybeSingle();
      if (!data) return json({ ok: false, error: "not_found" }, 404);
      targets = [email];
    }

    const results: SendOutcome[] = [];
    for (const email of targets) {
      results.push(await sendCodeTo(db, email));
      // Resend free tier allows 2 req/s; pace the batch.
      if (targets.length > 1) await new Promise((r) => setTimeout(r, 600));
    }
    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    return json({
      ok: failed.length === 0,
      ...(failed.length > 0 && { error: "resend_failed" }),
      sent,
      failed,
      quota_exceeded_likely: failed.some((f) => f.quota_hint),
    });
  }

  if (action === "refresh_status") {
    const { data: tracked } = await db
      .from("students")
      .select("email, resend_email_id, delivery_status")
      .not("resend_email_id", "is", null)
      .in("delivery_status", ["sent"]);
    const changes: { email: string; delivery_status: string }[] = [];
    for (const s of tracked ?? []) {
      const res = await fetch(`https://api.resend.com/emails/${s.resend_email_id}`, {
        headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}` },
      });
      if (!res.ok) continue;
      const { last_event } = await res.json();
      const status = last_event === "delivered"
        ? "delivered"
        : last_event === "bounced"
        ? "bounced"
        : ["failed", "complained"].includes(last_event)
        ? "failed"
        : null; // sent/queued/delivery_delayed → still 'sent'
      if (status && status !== s.delivery_status) {
        await db.from("students").update({ delivery_status: status }).eq("email", s.email);
        changes.push({ email: s.email, delivery_status: status });
      }
    }
    return json({ ok: true, checked: (tracked ?? []).length, changes });
  }

  if (action === "sync_sheet") {
    const result = await syncSheet(db);
    return json(result, result.ok ? 200 : 502);
  }

  return json({ ok: false, error: "unknown_action" }, 400);
});
