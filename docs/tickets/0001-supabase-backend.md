## 📖 Story / Why

Students book 1 of 25 Android project ideas, max 10 seats each, one booking per student, **no auth**, identity comes from a personal booking code each student receives by email. Every rule must be enforced by the database itself, race-condition safe, and seat counts must stream to open browsers in **realtime**. This ticket stands up that enforcement layer: schema, the two public SQL functions, and the realtime seat feed. Everything else builds on this.

## 🧭 Context

- Spec: `docs/PRD.md` (v2) §4, data model, booking codes, security model, race guarantee. Binding.
- A **v1** reference exists at `project-booking/supabase/schema.sql` (email+OTP era). Reuse what holds (projects seed, RLS approach, race-safe `book_project` skeleton) but implement the **v2 model**: codes live on `students` (`code_hash` unique, `code_sent_at`, `resend_email_id`, `delivery_status`), the `otps` table is gone, and a trigger-maintained `seat_counts` table powers Supabase Realtime.
- Rules in `CLAUDE.md` apply: RLS zero-policies (single exception: anon SELECT on `seat_counts`), fixed error contract, hashed codes only.

## 🔑 Access & prerequisites

- Supabase account access for the Humble-Coders org project (or a personal access token + project ref), from the manager via a secure channel. **Never commit tokens.**
- Supabase CLI installed locally (`brew install supabase/tap/supabase`).

## ✅ Scope / What to build

- [ ] Create/link the Supabase project (region `ap-south-1`); write the v2 `schema.sql` (evolving the v1 file in place) and apply it.
- [ ] `book_project(p_code, p_project_id)`: normalize code (trim/uppercase) → hash lookup on `students` → `invalid_code` if no match → `already_booked` (+held project title) → `FOR UPDATE` lock on project row → capacity check → insert → return `ok` + student email + project title.
- [ ] `get_projects()` unchanged in shape (id, title, description, api_name, api_url, api_note, capacity, seats_left).
- [ ] `seat_counts` trigger on `bookings` (insert/delete), anon SELECT policy, table added to the realtime publication; verify an anon client receives change events.
- [ ] Verify RLS lockdown: anon REST access to `students`/`projects`/`bookings` fails; `seat_counts` is read-only.
- [ ] Verify the 25-project seed matches PRD §5.5, capacity 10.
- [ ] Concurrency test script in `scripts/` (service role seeds ≥15 test students **with hashed codes**, fires 15 parallel `book_project` calls at one project; documents usage in header; cleans up after).

## 🎯 Acceptance Criteria

- [ ] Concurrency test: exactly 10 succeed, 5 return `full`; `bookings` count is exactly 10; `seat_counts.booked` is exactly 10. Reproducible.
- [ ] Correct code books; same student's second attempt → `already_booked` + title; garbage/revoked code → `invalid_code`; nonexistent project → `no_project`.
- [ ] An anon realtime subscriber sees a `seat_counts` event within ~2 s of a booking insert.
- [ ] Direct anon REST reads on `students`, `bookings`, `projects` return no data / permission error; no plaintext code exists anywhere in the DB.
- [ ] `get_projects()` seats_left agrees with `seat_counts` after bookings exist.

## 🚫 Out of scope

- The `admin` edge function, Resend, Google Sheet sync (ticket #2).
- Any frontend work.

## 🔗 Dependencies

- None, this is the foundation ticket.

## 📚 References

- `docs/PRD.md` §4 (v2 data model, codes, realtime, race guarantee), §5.5 (project list)
- `project-booking/supabase/schema.sql` (v1 reference to evolve)
- Supabase Realtime docs: https://supabase.com/docs/guides/realtime

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 1
```
