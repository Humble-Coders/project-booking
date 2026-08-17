// Shared Google-Sheet registry sync: fetch the published CSV, extract anything
// email-shaped, lowercase + dedupe, upsert into students (never deletes).
// Used by both the `admin` function (sync_sheet action) and `sync-students`.

import type { createClient } from "npm:@supabase/supabase-js@2";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SheetSyncResult =
  | { ok: true; emails_in_sheet: number; total_registered: number }
  | { ok: false; error: "not_configured" | "sheet_failed"; detail?: string };

export async function syncSheet(
  db: ReturnType<typeof createClient>,
): Promise<SheetSyncResult> {
  const url = Deno.env.get("SHEET_CSV_URL");
  if (!url) return { ok: false, error: "not_configured" };

  let csv: string;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return { ok: false, error: "sheet_failed", detail: `fetch status ${res.status}` };
    csv = await res.text();
  } catch (e) {
    return { ok: false, error: "sheet_failed", detail: String(e) };
  }

  const emails = [...new Set(
    (csv.match(/[^\s,"';]+@[^\s,"';]+\.[^\s,"';]+/g) ?? [])
      .map((e) => e.toLowerCase().trim())
      .filter((e) => EMAIL_RE.test(e)),
  )];

  if (emails.length > 0) {
    const { error } = await db
      .from("students")
      .upsert(emails.map((email) => ({ email })), { onConflict: "email", ignoreDuplicates: true });
    if (error) return { ok: false, error: "sheet_failed", detail: error.message };
  }

  const { count } = await db.from("students").select("*", { count: "exact", head: true });
  return { ok: true, emails_in_sheet: emails.length, total_registered: count ?? 0 };
}
