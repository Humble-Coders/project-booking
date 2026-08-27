// project-pdf: hands a student the brief for the project they actually booked.
//
// The student proves identity the same way they book, with their code. The
// database decides: the code is hashed, looked up on students, and matched
// against the bookings table. Only then does this function mint a signed URL
// for that one file, valid for 60 seconds.
//
// The browser never learns the storage path of a project the student did not
// book, and the PDFs bucket has no public read policy, so guessing a URL
// gets you nothing.
//
// Error contract: invalid_code | not_booked | wrong_project | no_file
//
// Secrets required: none beyond the platform defaults (SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are injected). Bucket name below must exist.

import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "viva-docs";
const LINK_TTL_SECONDS = 60;

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

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  let body: { code?: unknown; project_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const code = String(body.code ?? "").trim().toUpperCase();
  const projectId = Number(body.project_id);
  if (code === "" || !Number.isInteger(projectId)) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. The code identifies the student, exactly as in book_project.
  const { data: student } = await db
    .from("students")
    .select("email")
    .eq("code_hash", await sha256Hex(code))
    .maybeSingle();
  if (!student) return json({ ok: false, error: "invalid_code" }, 404);

  // 2. What did that student actually book?
  const { data: booking } = await db
    .from("bookings")
    .select("project_id, projects(title)")
    .eq("email", student.email)
    .maybeSingle();
  if (!booking) return json({ ok: false, error: "not_booked" }, 403);

  // 3. Asking for someone else's project tells you only which one is yours.
  const booked = booking as { project_id: number; projects?: { title?: string } | null };
  if (booked.project_id !== projectId) {
    return json(
      { ok: false, error: "wrong_project", project: booked.projects?.title ?? null },
      403,
    );
  }

  // 4. Short lived signed URL for that one file. A shared link dies in a minute.
  const path = `project-${String(projectId).padStart(2, "0")}.pdf`;
  const { data: signed, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(path, LINK_TTL_SECONDS, { download: true });
  if (error || !signed) return json({ ok: false, error: "no_file" }, 404);

  return json({ ok: true, url: signed.signedUrl, project: booked.projects?.title ?? null });
});
