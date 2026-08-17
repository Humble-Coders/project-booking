// send-otp — checks the email is a registered student, then emails a 6-digit
// code via Resend. If the email isn't found, it re-syncs the Google Sheet once
// and checks again (so newly added students work without a manual sync).
//
// Secrets required (supabase secrets set ...):
//   RESEND_API_KEY  — from resend.com
//   FROM_EMAIL      — e.g. "Humble Coders <projects@humblecoders.in>" (domain must be verified in Resend)
//   SHEET_CSV_URL   — the Google Sheet "publish to web" CSV link

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Pull every email-looking cell out of the published sheet CSV and upsert.
async function syncSheet(db: ReturnType<typeof createClient>): Promise<number> {
  const url = Deno.env.get("SHEET_CSV_URL");
  if (!url) return 0;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return 0;
  const csv = await res.text();
  const emails = [...new Set(
    (csv.match(/[^\s,"';]+@[^\s,"';]+\.[^\s,"';]+/g) ?? [])
      .map((e) => e.toLowerCase().trim())
      .filter((e) => EMAIL_RE.test(e)),
  )];
  if (emails.length === 0) return 0;
  const { error } = await db
    .from("students")
    .upsert(emails.map((email) => ({ email })), { onConflict: "email", ignoreDuplicates: true });
  if (error) console.error("sheet sync failed:", error.message);
  return emails.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  let email = "";
  try {
    email = String((await req.json()).email ?? "").toLowerCase().trim();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "invalid_email" }, 400);

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Registered? (with one sheet re-sync attempt on miss)
  let { data: student } = await db.from("students").select("email").eq("email", email).maybeSingle();
  if (!student) {
    await syncSheet(db);
    ({ data: student } = await db.from("students").select("email").eq("email", email).maybeSingle());
  }
  if (!student) return json({ ok: false, error: "not_registered" });

  // Rate limit: one code per 60 seconds per email
  const { data: existing } = await db.from("otps").select("last_sent_at").eq("email", email).maybeSingle();
  if (existing && Date.now() - new Date(existing.last_sent_at).getTime() < 60_000) {
    return json({ ok: false, error: "too_soon" }, 429);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const { error: otpErr } = await db.from("otps").upsert({
    email,
    code_hash: await sha256Hex(code),
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    attempts: 0,
    last_sent_at: new Date().toISOString(),
  });
  if (otpErr) {
    console.error(otpErr.message);
    return json({ ok: false, error: "server_error" }, 500);
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("FROM_EMAIL") ?? "Humble Coders <onboarding@resend.dev>",
      to: [email],
      subject: `${code} is your Humble Coders verification code`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:440px;margin:0 auto;padding:32px 24px;background:#07090f;border-radius:14px;color:#f4f6fb">
          <p style="margin:0 0 4px;font-size:14px;color:#94a0b8">Humble Coders — Project Booking</p>
          <h1 style="margin:0 0 16px;font-size:20px;color:#ffffff">Your verification code</h1>
          <div style="font-size:36px;letter-spacing:10px;font-weight:800;color:#5b7cc4;padding:16px 0">${code}</div>
          <p style="font-size:13px;color:#94a0b8;margin:16px 0 0">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
        </div>`,
    }),
  });
  if (!resendRes.ok) {
    console.error("Resend error:", await resendRes.text());
    return json({ ok: false, error: "email_failed" }, 500);
  }

  return json({ ok: true });
});
