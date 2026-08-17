## 📖 Story / Why

Without auth, the proof that a booking is legitimate is possession of the student's inbox: they enter their registered email, receive a 6-digit code via **Resend**, and only the right code books a seat. The registered-email list lives in a **Google Sheet** the instructor maintains — the system syncs from it automatically. This ticket delivers that whole verification pipeline.

## 🧭 Context

- Backend from ticket #1 must be live (the `students`/`otps` tables and `book_project` verification are already there).
- Reference implementations exist: `project-booking/supabase/functions/send-otp/index.ts` and `sync-students/index.ts` (Deno). Review against PRD §5.3 + the CLAUDE.md error contract, fix if needed, deploy, prove they work.
- `send-otp` behaviour: registered check → auto re-sync sheet once on unknown email → 60s rate limit → store **hashed** code (10-min expiry) → send styled email via Resend.
- `sync-students`: manual sync URL guarded by `SYNC_SECRET`; upsert-only, lower-cased, de-duplicated.

## 🔑 Access & prerequisites

- Supabase access (same as ticket #1).
- **Resend API key** — from the manager via secure channel. The `humblecoders.in` domain must be **verified in Resend** (manager handles DNS; coordinate — until then codes only deliver to the account owner's address).
- The Google Sheet's **publish-to-web CSV URL** — from the manager.

## ✅ Scope / What to build

- [ ] Deploy both edge functions (`supabase functions deploy`, no Docker needed — remote bundling).
- [ ] Set secrets via `supabase secrets set`: `RESEND_API_KEY`, `FROM_EMAIL` (`Humble Coders <projects@humblecoders.in>`), `SHEET_CSV_URL`, `SYNC_SECRET` (generate a long random string, hand to manager).
- [ ] Verify CORS works from a browser origin (the React app will call these cross-origin).
- [ ] Confirm the OTP email renders well in Gmail (dark card, code prominent).

## 🎯 Acceptance Criteria

- [ ] `POST send-otp` with a registered email → code lands in that inbox within ~10 s; `otps` row stores a hash, never the plain code (verify in table).
- [ ] Unregistered email → `not_registered`. Add that email to the Sheet, retry **without** manual sync → code arrives (auto re-sync works).
- [ ] Second request within 60 s → `too_soon` (HTTP 429).
- [ ] `sync-students?secret=<wrong>` → 401; correct secret → JSON with `emails_in_sheet` and `total_registered`, and new sheet emails appear in `students`.
- [ ] Full loop with ticket #1: send code → `book_project` with that code → booking row created.
- [ ] No secret appears anywhere in the repo or logs.

## 🚫 Out of scope

- Frontend (tickets #3–4).
- Resend domain DNS setup itself (manager) — but verifying it's green before sign-off is in scope.

## 🔗 Dependencies

- Ticket #1 (schema + functions live).
- Manager: Resend key, verified domain, Sheet CSV URL.

## 📚 References

- `docs/PRD.md` §5.3 (registry), §6 (secrets rules)
- `CLAUDE.md` (error contract — `send-otp` errors are fixed)
- Resend docs: https://resend.com/docs · Supabase edge functions: https://supabase.com/docs/guides/functions

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 2
```
