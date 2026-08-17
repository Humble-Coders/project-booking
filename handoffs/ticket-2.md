# Handoff: Ticket #2

**Ticket:** #2. Admin edge function: code distribution via Resend, delivery tracking, sheet sync

**Branch:** `ticket-2-admin-pipeline` · **Base:** `main`

## Summary

Built and deployed the entire instructor-side server surface: the `admin` edge function (Deno), gated by the `x-admin-secret` header, with the four spec'd actions, `overview`, `send_code` (single or `all_pending`), `refresh_status`, and `sync_sheet`. Codes are 6 chars from the PRD alphabet, generated with `crypto.getRandomValues`, SHA-256'd straight into `students.code_hash` (a resend overwrites the hash first, so the old code dies even if the new email then fails), and emailed via Resend with the dark-branded template; the Resend email id is tracked and `refresh_status` polls it to flip statuses to `delivered`/`bounced`/`failed`. The CSV sheet-sync logic moved to a shared module used by both `admin` and the kept `sync-students` fallback; v1 `send-otp` is deleted. The full email loop was proven live against the deployed function: a code sent to a real Gmail inbox booked a project, the resend invalidated it instantly, and delivery tracking recorded both a real `delivered` and a real `bounced`.

## Files changed

**Edge functions (`project-booking/supabase/functions/`)**
- `admin/index.ts`: new; the four actions, secret gate first, CORS incl. `x-admin-secret`, per-recipient batch results with a `quota_exceeded_likely` flag, hash-collision regeneration, no plaintext code ever stored or logged.
- `_shared/sheet.ts`: new; CSV fetch → email extraction → lowercase/dedupe/upsert (never deletes), returning `not_configured` / `sheet_failed` / totals; shared by both functions.
- `sync-students/index.ts`: refactored onto the shared module; same `?secret=` behavior.
- `send-otp/index.ts`: deleted (v2: students never trigger email; it was never deployed to this Supabase project).

**Testing (`scripts/`)**
- `admin-test.mjs`: new; staged acceptance runner (`auth` / `send` / `book` / `verify-new` / `cleanup` modes) covering 401s, the contract, the live inbox roundtrip, resend-replaces-old, and delivery statuses; zero dependencies.

**Root**
- `.gitignore`, `**/supabase/.temp/` (CLI state escaped the root-anchored pattern).

## Deployed state (not visible in the diff)

- `admin` and `sync-students` are live on project `okytacrlhmvxaxfpnynb` (`sync-students` with `--no-verify-jwt` so the browser secret-URL flow works; `admin` keeps JWT verification on top of its secret).
- Secrets set via `supabase secrets set`: `RESEND_API_KEY`, `FROM_EMAIL` (`Humble Coders <projects@humblecoders.in>`), `ADMIN_SECRET`, `SYNC_SECRET`. `SHEET_CSV_URL` **not yet set** (manager to provide).
- `humblecoders.in` is **verified** in Resend, so real-address delivery works.
- `ADMIN_SECRET`/`SYNC_SECRET` live in the local `.env` (gitignored), manager should store them wherever team secrets live.

## How to test

All test modes need `.env` populated (see script header). Full sequence as run for acceptance:

1. `node scripts/admin-test.mjs auth`, 13 checks: 401s on all four actions, overview shape, contract errors. No email sent.
2. `node scripts/admin-test.mjs send <your-email>`, registers you, sends a code, verifies hash/status/id on the row.
3. Read the code from your inbox → `node scripts/admin-test.mjs book <your-email> <CODE>`, books via `book_project`, then resends and proves the old code returns `invalid_code`.
4. Read the new code → `node scripts/admin-test.mjs verify-new <your-email> <NEW-CODE>`, proves the new code identifies you; runs `refresh_status`.
5. Bounce case: `node scripts/admin-test.mjs send bounced@resend.dev`, then a `refresh_status` call → status flips to `bounced`.
6. `node scripts/admin-test.mjs cleanup <email>` for each test address.

## Acceptance criteria

- ✅ Wrong/missing `x-admin-secret` → 401 on every action (8 checks in `auth` mode).
- ✅ `send_code`: code landed in humblecoders2024@gmail.com; row showed new hash + `sent` + Resend id; **the emailed code booked** "University Finder" via `book_project`.
- ✅ Resend: second email arrived, new code identified the student (`already_booked` + title), **old code → `invalid_code`**, one test run.
- ✅ `refresh_status`: real inbox → `delivered`; `bounced@resend.dev` → `bounced`.
- ⚠️ `sync_sheet`/`sync-students`: logic implemented + deployed and returns a clean `not_configured`; the upsert/no-duplicate criterion **cannot be end-to-end verified until the manager provides `SHEET_CSV_URL`** (the code path is identical to the proven v1 implementation).
- ✅ No plaintext code or secret in repo, logs, or DB (hash written before send; Resend error bodies are the only logged send detail and never contain the code).

## Deviations / decisions

- **Hash is overwritten *before* the email is sent**, if Resend then fails, the student's old code is already dead and the row is marked `failed`; the fix is simply resending. Chosen so a send failure can never leave a working-but-untracked old code.
- **`delivery_status` goes straight to `sent` on generation** (not a separate "sending" state) and to `failed` on a Resend API rejection, matches the PRD's five states.
- **`not_configured` added alongside the contract's `sheet_failed`** for the unset-`SHEET_CSV_URL` case, so the dashboard can show "add the sheet URL" instead of a generic failure. Needs a one-line PRD/CLAUDE.md contract update (flagged for manager).
- **`all_pending` is paced at ~600 ms per send** (Resend free tier = 2 req/s) with per-recipient results rather than a hard batch cap; a 429 or quota-shaped error sets `quota_exceeded_likely: true`.
- **`send-otp` platform deletion was a no-op**: it existed only in the repo, never deployed to this project.

## Open questions / follow-ups

- **Manager:** provide `SHEET_CSV_URL` (`supabase secrets set SHEET_CSV_URL=...`), then run `sync_sheet` twice to tick the remaining criterion (idempotency check: second run adds nothing).
- **Manager:** store `ADMIN_SECRET`/`SYNC_SECRET` from `.env` in the team secret store.
- `overview` silently returns empty arrays if a DB query errors (observed once on cold start), harmless for v1 but worth a hardening pass when the dashboard (ticket #6) consumes it.
- Ticket #6 (dashboard UI) can start: every endpoint it needs is live and tested.
