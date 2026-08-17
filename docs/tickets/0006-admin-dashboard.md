## 📖 Story / Why

The instructor's mission control — deliberately **very basic**, one page: see which student booked what, see whether each student's code email actually reached them, and fix the #1 support case ("I didn't get my code / I lost it") with one click that sends a fresh code which instantly replaces the old. No accounts — one admin secret unlocks it.

## 🧭 Context

- New `/admin` route in the `web/` app (route shell exists from ticket #3). Same stack rules: TS strict, Tailwind tokens, no UI kit.
- All data and actions go through the ticket #2 `admin` edge function with the `x-admin-secret` header. **The dashboard holds no privileged logic and no secret in the bundle** — the instructor types the secret once; keep it in localStorage.
- Spec: PRD §5.3. This page is not linked from the public site.

## 🔑 Access & prerequisites

- `ADMIN_SECRET` value — from the manager (set during ticket #2), via secure channel, for your own testing.
- A few test students in the sheet/database.

## ✅ Scope / What to build

- [ ] Gate screen: secret input → verify via a cheap `overview` call → wrong secret shows a locked-out message; valid secret persists (localStorage) with a "log out" affordance.
- [ ] **Students table:** email · booked project (or —) · code sent at · delivery-status chip (`none` grey / `sent` blue / `delivered` green / `bounced`·`failed` red) · per-row **Send code / Resend** button with confirm + spinner + result toast.
- [ ] **Toolbar:** "Send codes to all pending" (shows how many, confirms, reports per-recipient results incl. quota warnings) · "Refresh delivery statuses" · "Sync sheet" (reports added count) · live totals (students / booked / codes delivered).
- [ ] **Projects summary:** each project with seats taken (n/10) and the booked students' emails.
- [ ] Search/filter box over the students table (plain text match is enough).
- [ ] Auto-refresh overview every ~60 s while open; manual refresh button.

## 🎯 Acceptance Criteria

- [ ] Wrong secret cannot see data or trigger sends (verify the function 401s and the UI handles it).
- [ ] The full support loop works end-to-end on real data: student books → row shows their project; instructor resends their code → new email arrives, status flips to `sent`, refresh shows `delivered`, **old code fails / new code works** (retest via booking).
- [ ] "Send to all pending" on ≥3 pending test students: all receive codes, statuses update, already-coded students are untouched.
- [ ] Sheet sync from the dashboard brings a newly added email in as `none`/pending.
- [ ] Usable on a phone (the instructor will do resends from one) — table collapses acceptably at 375 px.
- [ ] `npm run build` clean; no secret anywhere in the bundle or repo.

## 🚫 Out of scope

- Delete/move bookings from the UI (Supabase table editor; runbook covers it — ticket #5).
- Charts, exports, pagination, multi-admin roles.
- Any new backend actions beyond the ticket #2 contract (needs a manager-approved ticket).

## 🔗 Dependencies

- Ticket #2 (`admin` edge function live) · Ticket #3 (app scaffold + tokens).

## 📚 References

- `docs/PRD.md` §5.3 (dashboard spec), Decision Log #10–12, #14 · `CLAUDE.md` (admin surface rules)

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 6
```
