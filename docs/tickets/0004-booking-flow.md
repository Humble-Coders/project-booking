## 📖 Story / Why

The moment of truth, radically simple: a student picks a project, types the **one code** from their email, and the system knows who they are and books their seat, under thirty seconds, on any device. Hundreds of students will hit this simultaneously on booking day with no support desk, so every outcome (wrong code, seat just taken, already booked) must resolve into a clear, friendly message.

## 🧭 Context

- Builds on the ticket #3 catalogue (`web/`) and the ticket #1 backend. **This flow is code-only, there is no email entry and no OTP-request step.** The prototype's modal is visual reference only; PRD v2 §5.2 is the flow spec.
- One call: `rpc book_project(p_code, p_project_id)`. Success returns the student's email + project title, surface both ("Booked as name@email.com").
- Error contract (fixed, `CLAUDE.md`): `invalid_code` · `already_booked` (+held project) · `full` · `no_project`. Handle exhaustively.

## 🔑 Access & prerequisites

- Working #1 backend; a test student with a known code, generate via the ticket #2 `admin` function if deployed, else seed directly with the service role (document how in the PR).

## ✅ Scope / What to build

- [ ] Booking modal (accessible: focus trap, Esc/overlay close, Enter submits): project name header, **single 6-char code input** (auto-uppercase, `A-Z2-9` filter, monospace-spaced display), "Confirm Booking" with loading state.
- [ ] Result states styled to theme: success (identity + project + celebratory tone) · `invalid_code` ("check the code from your email, or ask your instructor to resend, the newest email is the one that counts") · `already_booked` (shows held project, resolves informatively, remembers banner) · `full` (seat counts refresh immediately; invite picking another) · `no_project` · network error.
- [ ] Persist "You've booked X" banner (localStorage, cosmetic, server is truth); pre-fill nothing else.
- [ ] Seat counts refresh on every attempt outcome (realtime usually beats it, force-sync anyway).
- [ ] Typed API layer; no `any`.

## 🎯 Acceptance Criteria

- [ ] Real end-to-end booking with a real emailed (or seeded) code succeeds from a 375 px viewport; success screen shows the student's email + project.
- [ ] Demonstrated in testing: wrong code → `invalid_code` copy; superseded (re-sent) code → `invalid_code`; second booking attempt by same student → `already_booked` + project; booking a capacity-0 test project → `full` with live count refresh.
- [ ] Racing itself: two windows booking the last seat, one wins, the other gets `full` cleanly and sees the count move.
- [ ] Mid-flow refresh corrupts nothing; banner survives reload.
- [ ] `npm run build` clean; responsive at 375/768/1280 px.

## 🚫 Out of scope

- Admin dashboard (ticket #6) · Deployment (ticket #5) · Backend changes (contract concerns → flag the manager, don't patch around).

## 🔗 Dependencies

- Tickets #1 (backend) and #3 (catalogue UI). #2 helps for realistic email testing but a seeded code suffices.

## 📚 References

- `docs/PRD.md` §5.2 (modal spec + copy), Decision Log #2/#11 · `CLAUDE.md` (error contract, code format)

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 4
```
