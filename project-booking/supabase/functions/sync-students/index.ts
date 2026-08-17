// sync-students — secret-URL fallback for pulling the registered-email list
// from the Google Sheet (the dashboard normally does this via the admin
// function's sync_sheet action; same shared logic).
// Open in a browser:  https://<project-ref>.supabase.co/functions/v1/sync-students?secret=<SYNC_SECRET>
//
// Secrets required:
//   SHEET_CSV_URL — the Google Sheet "publish to web" CSV link
//   SYNC_SECRET   — any long random string, so only you can trigger a sync

import { createClient } from "npm:@supabase/supabase-js@2";
import { syncSheet } from "../_shared/sheet.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const secret = new URL(req.url).searchParams.get("secret");
  if (!secret || secret !== Deno.env.get("SYNC_SECRET")) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const result = await syncSheet(db);
  return json(result, result.ok ? 200 : 502);
});
