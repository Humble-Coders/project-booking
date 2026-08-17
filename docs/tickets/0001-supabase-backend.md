## 📖 Story / Why

Students book 1 of 25 Android project ideas, max 10 seats each, one booking per student, **no auth** — so every rule must be enforced by the database itself, race-condition safe. This ticket stands up that enforcement layer: the Supabase project, schema, and the two SQL functions that are the app's entire API surface. Everything else (emails, React UI) builds on top of this.

## 🧭 Context

- Spec: `docs/PRD.md` §4 (architecture, data model, security model, race guarantee). Binding.
- A reference implementation already exists at `project-booking/supabase/schema.sql` (tables, RLS, `get_projects()`, `book_project()`, 25-project seed). Your job is to **review it against the PRD, apply it, and prove it correct** — not rewrite it. Fix anything that violates the PRD and note it in the handoff.
- Rules in `CLAUDE.md` apply: RLS on with zero policies, no new RPCs, error contract is fixed.

## 🔑 Access & prerequisites

- Supabase account access for the Humble-Coders org project (or a personal access token + project ref) — get from the manager via a secure channel. **Never commit tokens.**
- Supabase CLI installed locally (`brew install supabase/tap/supabase`).

## ✅ Scope / What to build

- [ ] Create/link the Supabase project (region `ap-south-1`) and apply `schema.sql`.
- [ ] Verify RLS lockdown: with only the **anon key**, direct REST reads/writes on all four tables must fail; only `rpc/get_projects` and `rpc/book_project` respond.
- [ ] Verify the seed: 25 projects, capacity 10, content matches PRD §5.4.
- [ ] Write a small concurrency test script (Node or bash, lives in `scripts/`) that seeds ≥15 test students + valid OTP rows directly (service role), then fires 15 parallel `book_project` calls at one project.
- [ ] Document how to run the test in the script header; clean up test rows afterwards.

## 🎯 Acceptance Criteria

- [ ] Concurrency test: exactly 10 bookings succeed, 5 return `full`, `bookings` count for the project is exactly 10. Reproducible across runs.
- [ ] A second booking attempt by an already-booked email returns `already_booked` + the project title.
- [ ] Wrong code decrements attempts and returns `wrong_code` with `attempts_left`; 5th wrong attempt returns `too_many_attempts`; expired code returns `expired`.
- [ ] Direct `GET /rest/v1/students` (and the other 3 tables) with the anon key returns no data / permission error.
- [ ] `get_projects()` returns all 25 with correct `seats_left` after bookings exist.

## 🚫 Out of scope

- Edge functions, Resend, Google Sheet sync (ticket #2).
- Any frontend work.
- Schema changes beyond what PRD compliance requires.

## 🔗 Dependencies

- None — this is the foundation ticket.

## 📚 References

- `docs/PRD.md` §4 (data model, security, race guarantee), §5.4 (project list)
- `project-booking/supabase/schema.sql` (reference implementation)
- `project-booking/README.md` (setup runbook)

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 1
```
