# CLAUDE.md — Humble Coders Project Booking

## What this project is

A responsive single-page site (projects.humblecoders.in) where Humble Coders students pick one of 25 free-API Android project ideas and book it: enter registered email → receive 6-digit code (Resend) → confirm. Max 10 seats per project, exactly one booking per student, no auth/accounts. Full spec: **[docs/PRD.md](docs/PRD.md)** — read it before any ticket; its Decision Log is binding.

## Repo layout

```
web/                    ← Vite + React + TypeScript + Tailwind app (the deliverable; scaffolded by the first frontend ticket)
project-booking/
  index.html            ← vanilla JS prototype — REFERENCE ONLY. Pixel/behaviour baseline for the React app. Do not extend it.
  supabase/
    schema.sql          ← tables, RLS, book_project/get_projects functions, 25-project seed
    functions/send-otp/       ← emails OTP via Resend; auto re-syncs Google Sheet on unknown email
    functions/sync-students/  ← manual sheet sync, guarded by SYNC_SECRET
  README.md             ← infra setup + day-to-day ops runbook
docs/                   ← PRD, PROCESS, briefs, drafted tickets
handoffs/               ← finished-ticket reports
```

## Architecture (and the rules that go with it)

**Data flow:** React app → (1) RPC `get_projects()` for the catalogue with live seat counts, (2) edge function `send-otp` `{email}`, (3) RPC `book_project(p_email, p_code, p_project_id)` → jsonb result. That is the **entire** API surface.

1. **The database is the enforcement layer; the UI is never.** Seat caps, one-booking-per-student, and OTP checks live in Postgres (`FOR UPDATE` row lock + unique constraint on `bookings.email`). Never reimplement these client-side as anything more than UX hints, and never weaken them in SQL. Any schema change must preserve: race-safe capacity check, unique booking per email, hashed OTPs.
2. **RLS stays on with zero policies** on all four tables (`students`, `projects`, `bookings`, `otps`). Do NOT add policies, grants, or new RPCs without a manager-approved ticket saying so. The anon key is public by design — RLS + the two-function surface is the security model.
3. **Error contract is fixed.** `book_project` errors: `no_code | expired | too_many_attempts | wrong_code (+attempts_left) | already_booked (+project) | no_project | full`. `send-otp` errors: `invalid_email | not_registered | too_soon | email_failed`. The React app must handle every one with the friendly copy from the prototype; new error codes require updating this list.
4. **Frontend stack is locked:** Vite + React 18+ + TypeScript (strict) + Tailwind. Functional components and hooks only; no Redux/MobX (local state + a small fetch layer is enough); no UI kit — style with Tailwind against the theme tokens below. Use `@supabase/supabase-js` for RPC/function calls.
5. **Responsive on all devices is an acceptance criterion, not a nice-to-have.** Test 375 px (phone), 768 px (tablet), 1280 px+ (desktop). The prototype's breakpoint behaviour is the baseline.
6. **Theme tokens (from humblecoders.in — do not invent colors):** bg `#07090f` · card `#0f131c` · secondary `#161b27` · muted `#1a2030` · text `#f4f6fb` · muted-text `#94a0b8` · brand `#4263a6` · brand-2 `#5b7cc4` · border `#5b7cc424` · gold accent `#f5c451` · radius `0.875rem` · font Inter (logo script: Caveat). Dark theme only. Define these once in the Tailwind config, never as ad-hoc hex in components.

## Key rules

- **Secrets never enter the repo.** `RESEND_API_KEY`, `SHEET_CSV_URL`, `SYNC_SECRET`, `FROM_EMAIL` live in Supabase edge-function secrets (`supabase secrets set`). The only frontend config is `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (public, but still via `.env`, with `.env.example` committed).
- **Never log or store plain OTP codes** — hashes only (already the case; keep it).
- Don't touch `students`/`bookings` data in migrations or scripts — the Google Sheet and the Supabase dashboard are the instructor's surfaces.
- Edge functions are Deno TypeScript; keep them dependency-light (`@supabase/supabase-js` only).
- Copy tone: friendly, plain English, no jargon — match the prototype's error messages.

## How we work (ticket workflow)

Process doc: **[docs/PROCESS.md](docs/PROCESS.md)**. Flow: Product Owner `/draft-brief` → dev `/read-brief` + `/draft-ticket` → PO `/review-ticket` → dev `/start-ticket <#>` (plan first, then code) → PR + `/handoff` → manager `/manager-review`. Tickets are GitHub issues; drafted tickets live in `docs/tickets/`, handoff reports in `handoffs/`.

## References

- **Spec:** [docs/PRD.md](docs/PRD.md) (incl. the 25-project list + Decision Log)
- **Infra runbook:** [project-booking/README.md](project-booking/README.md) (Supabase/Resend/Sheet setup, ops)
- **External systems:** Supabase project (dashboard = admin UI) · Resend (needs humblecoders.in domain verified) · Google Sheet published as CSV (student registry)
- **Deploy target:** static build of `web/` at **projects.humblecoders.in**
