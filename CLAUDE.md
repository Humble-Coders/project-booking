# CLAUDE.md, Humble Coders Project Booking

## What this project is

A responsive single-page site (projects.humblecoders.in) where Humble Coders students pick one of 25 free-API Android project ideas and book it by entering their **personal booking code** (emailed to them beforehand by the instructor from the admin dashboard). Browsing is open with realtime seat counts. Max 10 seats per project, exactly one booking per student, no auth/accounts. Full spec: **[docs/PRD.md](docs/PRD.md)**, read it before any ticket; its Decision Log is binding.

## Repo layout

```
web/                    ← Vite + React + TypeScript + Tailwind app: routes `/` (public catalogue) and `/admin` (dashboard)
project-booking/
  index.html            ← vanilla JS prototype, VISUAL reference only. Its email+OTP flow is superseded (PRD v2: code-only booking).
  supabase/
    schema.sql          ← v1 reference; ticket #1 updates it to the PRD v2 model (codes on students, seat_counts, no otps)
    functions/          ← v1 send-otp/sync-students reference; v2 surface is `admin` + `sync-students`
  README.md             ← infra setup + day-to-day ops runbook
docs/                   ← PRD, PROCESS, briefs, drafted tickets
handoffs/               ← finished-ticket reports
```

## Architecture (and the rules that go with it)

**Public surface (student browser), exactly three things:** (1) RPC `get_projects()` → catalogue with seat counts; (2) RPC `book_project(p_code, p_project_id)` → jsonb result; (3) Supabase Realtime subscription on `seat_counts`. Nothing else.
**Admin surface, exactly one thing:** edge function `admin` (actions: `overview`, `send_code` single/all-pending, `refresh_status`, `sync_sheet`), authorized by `x-admin-secret` header. The `/admin` React route is a thin client over it and holds no privileged logic.

1. **The database is the enforcement layer; the UI is never.** Seat caps, one-booking-per-student, and code checks live in Postgres (`FOR UPDATE` row lock + unique constraint on `bookings.email`). Never reimplement these client-side as anything more than UX hints, and never weaken them in SQL. Any schema change must preserve: race-safe capacity check, unique booking per email, hashed codes.
2. **RLS stays on with zero policies** on `students`, `projects`, `bookings`. The single exception is an anon **SELECT** policy on `seat_counts` (aggregate integers only) to power Realtime. Do NOT add other policies, grants, or RPCs without a manager-approved ticket.
3. **Error contract is fixed.** `book_project`: `invalid_code | already_booked (+project) | no_project | full`, success returns `ok + email + project`. `admin` fn: `unauthorized | not_found | resend_failed | sheet_failed`. The React app must handle every one with friendly copy; new error codes require updating this list and the PRD.
4. **Booking codes:** 6 chars from `A-Z2-9` minus `O/I` (no 0/1 lookalikes), case-insensitive on entry, unique across students, SHA-256 hashed at rest. Generated **only** by the admin `send_code` action; a resend overwrites the hash, newest code always works, previous dies instantly. Never log or store plaintext codes anywhere.
5. **Frontend stack is locked:** Vite + React 18+ + TypeScript (strict) + Tailwind. Functional components and hooks only; no Redux/MobX; no UI kit; `@supabase/supabase-js` for RPC/realtime. React Router (or equivalent light routing) only for `/` and `/admin`.
6. **Responsive on all devices is an acceptance criterion, not a nice-to-have.** Test 375 px (phone), 768 px (tablet), 1280 px+ (desktop).
7. **Theme tokens (from humblecoders.in, do not invent colors):** bg `#07090f` · card `#0f131c` · secondary `#161b27` · muted `#1a2030` · text `#f4f6fb` · muted-text `#94a0b8` · brand `#4263a6` · brand-2 `#5b7cc4` · border `#5b7cc424` · gold accent `#f5c451` · radius `0.875rem` · font Inter (logo script: Caveat). Dark theme only. Define once in the Tailwind config, never ad-hoc hex in components. Use the **actual humblecoders.in logo asset**.

## Key rules

- **Secrets never enter the repo.** `RESEND_API_KEY`, `SHEET_CSV_URL`, `SYNC_SECRET`, `ADMIN_SECRET`, `FROM_EMAIL` live in Supabase edge-function secrets (`supabase secrets set`). Frontend config is only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (public, but still via `.env`, with `.env.example` committed). The admin secret is typed by the instructor at runtime, never bundled.
- The site **never sends email**; only the `admin` edge function does (via Resend).
- Don't touch `students`/`bookings` data in migrations or scripts, the Google Sheet and the dashboard are the instructor's surfaces.
- Edge functions are Deno TypeScript; keep them dependency-light (`@supabase/supabase-js` only).
- Copy tone: friendly, plain English, no jargon, match the prototype's error-message tone.

## How we work (ticket workflow)

Process doc: **[docs/PROCESS.md](docs/PROCESS.md)**. Flow: Product Owner `/draft-brief` → dev `/read-brief` + `/draft-ticket` → PO `/review-ticket` → dev `/start-ticket <#>` (plan first, then code) → PR + `/handoff` → manager `/manager-review`. Tickets are GitHub issues; drafted tickets live in `docs/tickets/`, handoff reports in `handoffs/`.

## References

- **Spec:** [docs/PRD.md](docs/PRD.md) (incl. the 25-project list + Decision Log)
- **Infra runbook:** [project-booking/README.md](project-booking/README.md) (Supabase/Resend/Sheet setup, ops)
- **External systems:** Supabase project (+ dashboard for manual data fixes) · Resend (needs humblecoders.in domain verified) · Google Sheet published as CSV (student registry)
- **Deploy target:** static build of `web/` at **projects.humblecoders.in**
