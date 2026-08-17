## 📖 Story / Why

Ship it. The finished app goes live at **projects.humblecoders.in**, survives a realistic booking-day stampede, and leaves the instructor with a simple runbook for the one job they'll do repeatedly: managing students and bookings. This ticket turns the built product into the operating product.

## 🧭 Context

- `web/` app complete (tickets #3–4), backend live (tickets #1–2).
- Vite build outputs static files — host on any static host (Vercel/Netlify/Cloudflare Pages recommended) with the manager pointing the `projects` DNS record at it.
- The old prototype and setup docs live in `project-booking/` — the runbook there must be updated to describe the deployed reality.

## 🔑 Access & prerequisites

- Hosting account access (manager decides Vercel/Netlify/other — confirm before starting) and coordination with the manager for the `projects.humblecoders.in` DNS record.
- Production `VITE_*` env values (same as ticket #3).

## ✅ Scope / What to build

- [ ] Production build + deploy of `web/`, wired to the production Supabase project; custom domain `projects.humblecoders.in` active with HTTPS.
- [ ] Page metadata: title, favicon (Humble Coders mark), OG tags so the link previews nicely when shared with students.
- [ ] **Booking-day load rehearsal** against production: re-run/extend the ticket #1 concurrency script through the real deployed stack (15+ parallel bookings on one project) — verify exactly 10 win; document Resend's 100/day free-tier cap and the recommended mitigation (PRD Open Decision #1) in the runbook.
- [ ] Update `project-booking/README.md` into the final ops runbook: add students (Sheet), force sync URL, view/undo bookings, change capacity, reset semester, redeploy steps.
- [ ] Repo hygiene: `web/` README with local dev instructions; CI-friendly `npm run build` documented; remove/quarantine anything obsolete.

## 🎯 Acceptance Criteria

- [ ] https://projects.humblecoders.in loads the app over HTTPS on phone + desktop; a real student-flow booking completes on production.
- [ ] Production concurrency rehearsal: exactly 10 of 15+ simultaneous bookings succeed; results captured in the handoff.
- [ ] Lighthouse (mobile) on production: no accessibility score below 90; page interactive fast on 4G throttling.
- [ ] The instructor can follow the runbook alone: add a student → they can book; delete a booking → seat frees up on the site within one refresh cycle.
- [ ] A fresh `git clone` + documented steps reproduces a working local dev setup.

## 🚫 Out of scope

- New features (booking window, waitlists — future tickets if wanted).
- Paid-tier upgrades (document the recommendation; manager decides).

## 🔗 Dependencies

- Tickets #1–4 complete and merged.
- Manager: hosting choice, DNS record, final go/no-go.

## 📚 References

- `docs/PRD.md` §6–7 (NFRs, open decisions) · `project-booking/README.md` (runbook to update)

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 5
```
