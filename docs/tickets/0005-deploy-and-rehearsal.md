## 📖 Story / Why

Ship it. The finished app — public catalogue **and** admin dashboard — goes live at **projects.humblecoders.in**, survives a realistic booking-day stampede, and leaves the instructor with a simple runbook for their real workflow: sync students, blast codes, watch delivery, resend on request, watch bookings roll in. This ticket turns the built product into the operating product.

## 🧭 Context

- `web/` app complete (tickets #3, #4, #6), backend live (tickets #1–2).
- Vite build outputs static files — host on any static host (Vercel/Netlify/Cloudflare Pages recommended); manager points the `projects` DNS record at it. `/admin` must work as a direct URL (SPA fallback routing configured on the host).
- The prototype and setup docs live in `project-booking/` — the runbook must be rewritten for the v2 (code-distribution) reality.

## 🔑 Access & prerequisites

- Hosting account access (manager decides Vercel/Netlify/other — confirm before starting) + coordination for the `projects.humblecoders.in` DNS record.
- Production `VITE_*` env values.

## ✅ Scope / What to build

- [ ] Production build + deploy wired to the production Supabase project; custom domain live with HTTPS; SPA fallback so `/admin` deep-links work.
- [ ] Page metadata: title, favicon (Humble Coders mark), OG tags for a clean link preview when shared with students.
- [ ] **Booking-day load rehearsal on production:** run the ticket #1 concurrency script through the deployed stack (15+ parallel bookings on one project) — exactly 10 win; watch the realtime counts move live in an open browser during the run.
- [ ] Rewrite `project-booking/README.md` as the final ops runbook: semester setup → sheet sync → "send codes to all pending" (incl. Resend 100/day free-cap strategy, PRD Open Decision #1) → monitoring delivery → resend flow → viewing/undoing bookings (table editor) → changing capacity → semester reset → redeploy steps.
- [ ] Repo hygiene: `web/README.md` with local dev instructions; `npm run build` documented CI-friendly; prototype clearly marked as archived reference.

## 🎯 Acceptance Criteria

- [ ] https://projects.humblecoders.in loads over HTTPS on phone + desktop; `/admin` direct URL works; a real code-based booking completes on production.
- [ ] Production rehearsal: exactly 10 of 15+ simultaneous bookings succeed; realtime counts observed updating live; results captured in the handoff.
- [ ] Lighthouse (mobile) on production: accessibility ≥90; interactive fast on 4G throttling.
- [ ] The instructor completes the full runbook loop unaided on production: add student to sheet → sync → send code → student email arrives → booking succeeds → dashboard shows it; delete the booking → seat frees on the live site within seconds.
- [ ] Fresh `git clone` + documented steps reproduces a working local dev setup.

## 🚫 Out of scope

- New features (booking window, waitlists — future tickets).
- Paid-tier upgrades (document the recommendation; manager decides).

## 🔗 Dependencies

- Tickets #1, #2, #3, #4 and **#6 (dashboard)** complete and merged.
- Manager: hosting choice, DNS record, final go/no-go.

## 📚 References

- `docs/PRD.md` §6–7 (NFRs, open decisions) · `project-booking/README.md` (runbook to rewrite)

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 5
```
