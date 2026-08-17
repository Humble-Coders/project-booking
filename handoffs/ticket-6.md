# Handoff — Ticket #6

**Ticket:** #6 — Admin dashboard: bookings overview, delivery monitoring, code resend

**Branch:** `ticket-6-admin-dashboard` · **Base:** `main`

## Summary

Replaced the `/admin` route shell with the instructor's one-page mission control, built entirely as a thin client over the ticket #2 edge function: a secret gate, a students table with delivery-status chips and per-row Send/Resend, a toolbar (send-to-all-pending with confirm and quota warning, refresh delivery statuses, sync sheet, live totals, manual refresh, log out), a projects summary, a search filter, and 60-second auto-refresh that pauses while a mutation is in flight. The secret is typed once and lives only in localStorage — a production bundle scan confirms it (and the service-role and Resend keys) appear nowhere in `dist/`. The complete support loop was verified live on real data: four pending students received codes in one blast, the real inbox flipped to `Delivered` and Resend's bounce address to `Bounced`, a booking surfaced across the row, the projects summary and totals, and a dashboard-initiated resend killed the old code (`invalid_code`) while the new one identified the student. Also carries the focus-restore fix that PR #10's review deferred to this UI pass.

## Files changed

**Data layer (`web/src/lib`)**
- `admin.ts` — typed client for all four actions with per-action result interfaces and a discriminated `AdminResult`; `unauthorized` is a first-class variant that drives the gate. Partial `send_code` failures keep their payload so the UI can name who failed.
- `adminSecret.ts` — guarded localStorage get/set/clear (mirrors `myBooking.ts`).

**Components (`web/src/components/admin`)**
- `GateScreen.tsx` — password input verified by a cheap `overview` call; 401 → locked-out copy, nothing rendered.
- `StudentsTable.tsx` — desktop grid with a header row; collapses to labelled stacked cards below `md` for phone resends.
- `StatusChip.tsx` — the five delivery states in brand tokens (grey/blue/green/red/red).
- `Toolbar.tsx` — totals pills, the four actions, log out, search input.
- `ProjectsSummary.tsx` — per-project n/capacity plus booked emails.
- `Toasts.tsx` — dismissible transient results.

**Hooks / page**
- `useAdminOverview.ts` — owns overview state per secret: initial load, 60 s auto-refresh paused via a ref while mutating, manual `reload()`, `unauthorized` flag.
- `useToast.ts` — minimal toast stack (5 s lifetime).
- `pages/Admin.tsx` — gate ⇄ dashboard composition, the five action runners with result-to-copy mapping (including the Resend daily-cap hint and `not_configured` guidance), search filtering.
- `hooks/useFocusTrap.ts` — **PR #10 follow-up**: the escape callback is held in a ref and dropped from the effect deps, so a `pending` flip can no longer re-run the trap and clobber focus restore.

## How to test

1. `cd web && npm run dev`, open `/admin`. Enter a wrong secret → locked-out message, no data, nothing stored.
2. Enter the real `ADMIN_SECRET` (from `.env`) → dashboard loads.
3. Seed 3+ students without codes (service role insert of `{email}` rows; include one real inbox and `bounced@resend.dev`).
4. "Send codes to all pending (N)" → confirm → all chips flip to `Sent`; toast reports the count.
5. Wait ~30 s → "Refresh delivery statuses" → real inbox → `Delivered`, bounce address → `Bounced`; totals update.
6. Book with the emailed code (public page or RPC) → "Refresh data" → the student's row shows the project, and the projects summary lists them.
7. Per-row **Resend** on that student → the old code now returns `invalid_code`, the new emailed code returns `already_booked` + their project.
8. 375 px: rows collapse to cards, no horizontal scroll, search filters.
9. `npm run build`, then grep `dist/` for the admin secret — must return nothing.

## Acceptance criteria

- ✅ Wrong secret sees no data and triggers nothing: gate stayed locked, `@example.invalid` never appeared in the DOM, nothing written to localStorage (function returns 401 — verified again in this session).
- ✅ Full support loop on real data: booking surfaced in the row + projects summary + totals; dashboard resend → **old code `invalid_code`, new code `already_booked` + "Dictionary App"**; status went `Sent` → `Delivered`.
- ✅ Send-to-all-pending on 4 pending students: all four sent, every chip flipped to `Sent`; students who already have codes are excluded by the function's `code_hash IS NULL` filter (the button's count reflects it — it read `(0)` afterwards).
- ⚠️ Sheet sync brings a new email in as pending — **blocked on the manager**: `SHEET_CSV_URL` is still unset, so the button correctly reports `not_configured` with actionable copy. The upsert path is unchanged from ticket #2's shared module.
- ✅ Usable on a phone: 375 px verified — stacked labelled cards, full-width buttons, `scrollWidth === clientWidth`.
- ✅ `npm run build` clean; production bundle scanned — no admin secret, service-role key, or Resend key present.

## Deviations / decisions

- **Per-row resend uses no confirm dialog** (the toolbar's bulk action does). A single resend is cheap, idempotent-by-design, and the instructor is often mid-conversation with the student; a confirm on every row would slow the #1 support path. Bulk send keeps its confirm because it can consume a large share of the Resend daily cap.
- **Auto-refresh pauses during mutations** via a ref-held flag, so a 60 s poll can't land mid-send and repaint stale rows.
- **`unauthorized` mid-session** clears the stored secret and returns to the gate rather than showing an error page — matches "no accounts, one secret" and recovers by re-entry.
- **Toast lifetime is 5 s**; during verification this expired before some scripted assertions could read it — the toasts themselves are correct (captured successfully with tighter timing).
- **Focus-trap fix included here** rather than in a separate PR, as PR #10's review explicitly deferred it to "ticket #6's UI pass".

## Open questions / follow-ups

- **Manager:** provide `SHEET_CSV_URL` (`supabase secrets set SHEET_CSV_URL=…`) to close the one unticked criterion here and the matching leftover from ticket #2.
- `overview` still collapses server-side query errors into empty arrays (noted in ticket #2's review); the dashboard would render "0 students" rather than an error in that case. Worth hardening in the function if it ever bites.
- Ticket #5 (deploy + rehearsal + runbook) is now unblocked — this was its last dependency.
