## 📖 Story / Why

The instructor, not the site, hands each student their key: a personal 6-character booking code, emailed via **Resend** from the admin dashboard, with delivery tracked so nobody falls through the cracks. When a student says "I never got it / I lost it," one click sends a **fresh code that immediately replaces the old one**. This ticket builds the entire server side of that: the `admin` edge function and the Google Sheet registry sync.

## 🧭 Context

- Backend from ticket #1 must be live (`students` with `code_hash`/`delivery_status` columns).
- The `admin` edge function (Deno) is the **only** admin surface, authorized by an `x-admin-secret` header. Actions:
  - `overview`: students (email, booked project, code_sent_at, delivery_status) + per-project booking lists + totals;
  - `send_code`: for one email or `all_pending` (students with no code): generate unique code (`A-Z2-9` minus `O/I`, 6 chars), **overwrite** `code_hash`, email via Resend, store `resend_email_id`, status `sent`;
  - `refresh_status`: poll Resend (`GET /emails/{id}`) for each tracked id, map last_event → `delivered`/`bounced`/`failed`;
  - `sync_sheet`: pull the published CSV, upsert emails (lower-cased, de-duplicated, never deletes).
- Keep the standalone `sync-students` function (secret-URL sync) as a fallback; share the sheet-parsing logic. v1 `send-otp` is retired, delete it from the repo.
- `CLAUDE.md` rules: codes hashed only, never logged; secrets only in Supabase; site never sends email.

## 🔑 Access & prerequisites

- Supabase access (same as ticket #1).
- **Resend API key**: from the manager via secure channel. `humblecoders.in` must be **verified in Resend** (manager handles DNS; coordinate, until then emails only deliver to the account owner's address).
- Google Sheet **publish-to-web CSV URL**, from the manager.
- Generate `ADMIN_SECRET` + `SYNC_SECRET` (long random strings) and hand them to the manager securely.

## ✅ Scope / What to build

- [ ] Implement + deploy the `admin` edge function with the four actions above (`supabase functions deploy`, remote bundling, no Docker).
- [ ] Code-email template: Humble Coders dark branding, the code huge and copyable, one line of instructions + the booking site link.
- [ ] Set secrets: `RESEND_API_KEY`, `FROM_EMAIL` (`Humble Coders <projects@humblecoders.in>`), `SHEET_CSV_URL`, `SYNC_SECRET`, `ADMIN_SECRET`.
- [ ] `send_code all_pending` must batch sensibly and report per-recipient success/failure (Resend free tier = 100/day, surface a clear "quota likely exceeded" result rather than failing silently).
- [ ] CORS for browser calls from the dashboard origin.
- [ ] Retire `send-otp` (remove from repo + platform).

## 🎯 Acceptance Criteria

- [ ] Wrong/missing `x-admin-secret` → 401 on every action.
- [ ] `send_code` for a test email: code lands in the inbox, `students` row shows new hash + `sent` + Resend id; **the emailed code books successfully** via `book_project` (integration with #1).
- [ ] Resend to the same student: new email arrives, **new code works, old code returns `invalid_code`**, proven in one test run.
- [ ] `refresh_status` flips a delivered test email to `delivered`; a fake/bounced address ends up `bounced`/`failed`.
- [ ] `sync_sheet`/`sync-students`: new sheet emails appear as students with `delivery_status = none`; re-running doesn't duplicate or delete.
- [ ] No plaintext code or secret in repo, logs, or DB.

## 🚫 Out of scope

- Dashboard UI (ticket #6), test with curl/scripts.
- Frontend booking flow (ticket #4).
- Resend domain DNS setup itself (manager), verifying it's green before sign-off is in scope.

## 🔗 Dependencies

- Ticket #1 (v2 schema live).
- Manager: Resend key, verified domain, Sheet CSV URL.

## 📚 References

- `docs/PRD.md` §5.3–5.4 (dashboard actions, registry), §6 (secrets, code hygiene), Decision Log #10–12
- `project-booking/supabase/functions/` (v1 reference for Resend + CSV parsing patterns)
- Resend API: https://resend.com/docs/api-reference

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 2
```
