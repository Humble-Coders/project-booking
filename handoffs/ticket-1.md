# Handoff — Ticket #1

**Ticket:** #1 — Supabase backend: v2 schema, booking functions, realtime seat feed

**Branch:** `ticket-1-supabase-backend` · **Base:** `main`

## Summary

Rebuilt the Supabase enforcement layer to the PRD v2 model and applied it to the live project (`okytacrlhmvxaxfpnynb`, region `ap-south-1`). Codes now live on `students` as a unique SHA-256 `code_hash` with Resend delivery-tracking columns; the v1 `otps` table is dropped. `book_project` takes only `(p_code, p_project_id)` — the code alone identifies the student — and keeps the race-safe `FOR UPDATE` + count pattern with the fixed error contract. A trigger-maintained `seat_counts` table is the sole anon-readable table and is in the realtime publication; an anon subscriber received an UPDATE event 362 ms after a booking. A dependency-free concurrency test script proves the 10/5 race split and the full contract, and passed twice in a row against the live database.

## Files changed

**Database (`project-booking/supabase/`)**
- `schema.sql` — rewritten in place to v2: student code columns + delivery-status check, `otps` dropped, `seat_counts` + `bump_seat_count()` trigger, anon SELECT policy + realtime publication for `seat_counts`, new `book_project(p_code, p_project_id)`, `get_projects()` now reads `seat_counts`, seed unchanged plus `seat_counts` pre-seeding. Idempotent — safe to re-run whole. Note: `book_project`'s `search_path` includes `extensions` because Supabase installs pgcrypto there (plain `public` broke `digest()` at runtime).

**Testing (`scripts/`)**
- `concurrency-test.mjs` — new; zero-dependency Node script: seeds 15 hashed-code test students (service role), fires 15 parallel anon `book_project` calls, asserts 10 ok / 5 full, checks `seat_counts`, error contract, RLS lockdown, `get_projects()` agreement; self-cleaning. Usage in the header.

**Repo hygiene (root)**
- `.gitignore` — new; `.env` was previously trackable — now excluded, plus editor/build noise.
- `.env.example` — new; documents the two public frontend vars per CLAUDE.md.

## How to test

1. `cp .env.example .env`, fill in the project URL + publishable key, and add `SUPABASE_SERVICE_ROLE_KEY=<secret key>` (dashboard → Project Settings → API Keys).
2. Schema is already applied; to re-apply, paste all of `project-booking/supabase/schema.sql` into the SQL Editor and Run (idempotent).
3. Run the concurrency test against an empty project (25 is free):
   ```bash
   set -a && source .env && set +a && SUPABASE_URL="$VITE_SUPABASE_URL" SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" node scripts/concurrency-test.mjs 25
   ```
   Expect `ALL CHECKS PASSED` — 15 named checks covering the race, error contract, RLS, and `get_projects` agreement.
4. Realtime (optional manual check): subscribe to `postgres_changes` on `public.seat_counts` with the anon key and insert a booking — an UPDATE event arrives in well under 2 s. (Verified during development with a throwaway script; not committed since it needs `@supabase/supabase-js` and the repo has no `package.json` yet — see follow-ups.)

## Acceptance criteria

- ✅ Concurrency test: exactly 10 succeed, 5 `full`; `bookings` = 10; `seat_counts.booked` = 10 — passed twice (reproducible).
- ✅ Correct code books (case-insensitive — the test submits lowercase); second attempt → `already_booked` + held title; garbage code → `invalid_code`; nonexistent project → `no_project`.
- ✅ Anon realtime subscriber saw the `seat_counts` UPDATE 362 ms after booking (criterion: ~2 s).
- ✅ Anon REST reads on `students`/`bookings`/`projects` return no rows; anon PATCH on `seat_counts` has no effect; only hashes stored (`code_hash` is the only code column anywhere).
- ✅ `get_projects()` `seats_left` agreed with `seat_counts` after the 10 test bookings.
- ✅ 25-project seed matches PRD §5.5, all capacity 10.

## Deviations / decisions

- **`search_path = public, extensions` on `book_project`** — required; Supabase hosts pgcrypto in `extensions`, and the pinned `public`-only path made `digest()` unresolvable (found live, fixed, re-verified).
- **`seat_counts` rows are pre-seeded to 0** for all projects so realtime subscribers get UPDATE events (with `REPLICA IDENTITY FULL`) from the very first booking, and `get_projects()` can join against it directly.
- **Test script is `.mjs` (plain Node), not TypeScript** — the ticket said "concurrency test script in `scripts/`"; with no Node/Deno toolchain in the repo yet, zero-dependency `node:crypto` + `fetch` keeps it runnable anywhere.
- **Schema applied via the Supabase Management API** (personal access token) rather than a linked CLI migration — the CLI's interactive login isn't possible in this environment. Functionally identical; the SQL file remains the source of truth.

## Open questions / follow-ups

- **GitHub remote unreachable:** `Humble-Coders/project-booking` returns "repository not found" for the `sharnyagoel19` account — no push/PR possible until access is granted or the repo is created. The ticket was worked from the local draft `docs/tickets/0001-supabase-backend.md` (issue #1 was also unfetchable).
- **Realtime check isn't committed as a repeatable script** — worth adding once a `package.json` exists (ticket #3 introduces the web app; the script could live beside the concurrency test then).
- Ticket #2 (admin edge function) can start immediately; the `students` columns it needs (`code_hash`, `code_sent_at`, `resend_email_id`, `delivery_status`) are live.
