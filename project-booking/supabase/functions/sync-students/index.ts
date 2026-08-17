// sync-students — manually pull the registered-email list from the Google Sheet.
// Open in a browser:  https://<project-ref>.supabase.co/functions/v1/sync-students?secret=<SYNC_SECRET>
//
// Secrets required:
//   SHEET_CSV_URL — the Google Sheet "publish to web" CSV link
//   SYNC_SECRET   — any long random string, so only you can trigger a sync

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const secret = new URL(req.url).searchParams.get("secret");
  if (!secret || secret !== Deno.env.get("SYNC_SECRET")) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const sheetUrl = Deno.env.get("SHEET_CSV_URL");
  if (!sheetUrl) return json({ ok: false, error: "SHEET_CSV_URL not set" }, 500);

  const res = await fetch(sheetUrl, { redirect: "follow" });
  if (!res.ok) return json({ ok: false, error: `sheet fetch failed (${res.status})` }, 502);
  const csv = await res.text();

  const emails = [...new Set(
    (csv.match(/[^\s,"';]+@[^\s,"';]+\.[^\s,"';]+/g) ?? [])
      .map((e) => e.toLowerCase().trim())
      .filter((e) => EMAIL_RE.test(e)),
  )];

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await db
    .from("students")
    .upsert(emails.map((email) => ({ email })), { onConflict: "email", ignoreDuplicates: true });
  if (error) return json({ ok: false, error: error.message }, 500);

  const { count } = await db.from("students").select("*", { count: "exact", head: true });
  return json({ ok: true, emails_in_sheet: emails.length, total_registered: count });
});
