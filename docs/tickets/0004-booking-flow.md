## 📖 Story / Why

The moment of truth: a student picks a project, proves they own their registered inbox, and wins a seat — in under a minute, on any device. Every failure mode (wrong code, full project, already booked…) must resolve into a clear, friendly message, because hundreds of students will hit this under pressure on booking day and there is no support desk.

## 🧭 Context

- Builds directly on the ticket #3 catalogue (`web/`) and the ticket #1/#2 backend.
- Flow (PRD §5.2, prototype `project-booking/index.html` is the behaviour baseline): Book button → **Step 1** email + "Send Code" (`POST functions/v1/send-otp`) → **Step 2** 6-digit input + "Confirm Booking" (`rpc/book_project`) with resend cooldown → **Step 3** success.
- The **error contract in `CLAUDE.md` is fixed and must be handled exhaustively** — every code from both endpoints mapped to the prototype's friendly copy.

## 🔑 Access & prerequisites

- Working ticket #2 pipeline (codes actually delivering) and a registered test email you control — ask the manager to add yours to the Sheet.

## ✅ Scope / What to build

- [ ] Booking modal (accessible: focus trap, Esc/overlay close, Enter submits) with the three steps, styled to theme tokens.
- [ ] Step 1: email input (pre-filled from localStorage), validation, loading state; map `invalid_email` / `not_registered` / `too_soon` / `email_failed`.
- [ ] Step 2: digits-only 6-char input, "Resend code" with 60 s countdown; map `wrong_code` (+attempts left) / `expired` / `too_many_attempts` / `no_code` / `full` (also refreshes seat counts) / `already_booked` (shows held project, resolves informatively).
- [ ] Step 3: success with project title; persist "You've booked X" banner (localStorage, cosmetic — server is truth).
- [ ] Seat counts refresh after every booking attempt and on modal close.
- [ ] Typed API layer for both calls; no `any`.

## 🎯 Acceptance Criteria

- [ ] Real end-to-end booking succeeds against the live backend with a real emailed code, from a phone-sized viewport.
- [ ] Every error code above is reachable in testing and shows its friendly message (demonstrate at least: wrong code ×2 shows attempts left, `too_soon` on rapid resend, `already_booked` on a second booking attempt, `full` on a capacity-0 test project).
- [ ] Refreshing mid-flow doesn't corrupt anything; reopening shows the booked banner.
- [ ] Resend button is disabled during countdown and re-enables at 0.
- [ ] `npm run build` clean; responsive at 375/768/1280 px.

## 🚫 Out of scope

- Deployment (ticket #5).
- Backend/edge-function changes (if the contract seems wrong, flag the manager — don't patch around it).

## 🔗 Dependencies

- Tickets #1, #2 (live backend + OTP delivery), #3 (catalogue UI).

## 📚 References

- `docs/PRD.md` §5.2 (modal spec + error copy) · `CLAUDE.md` (error contract)
- `project-booking/index.html` (baseline behaviour incl. all error messages)

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 4
```
