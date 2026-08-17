## 📖 Story / Why

This is the face of the product: a page students open, instantly recognize as Humble Coders, and browse 25 project ideas with live seat availability. It must look like a natural extension of humblecoders.in — same logo, same dark palette, same typography — and work beautifully from a 375 px phone to a desktop.

## 🧭 Context

- Fresh React app in `web/` — **Vite + React 18 + TypeScript (strict) + Tailwind** (locked in `CLAUDE.md`; hooks only, no Redux, no UI kit, `@supabase/supabase-js` for calls).
- A vanilla-JS prototype at `project-booking/index.html` is the **pixel/behaviour baseline** — open it in a browser, match it, improve it. Do not extend the prototype itself.
- Data comes from `rpc/get_projects` (ticket #1): id, title, description, api_name, api_url, api_note, capacity, seats_left.

## 🔑 Access & prerequisites

- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — from the manager (anon key is public-safe; still goes in `.env`, with `.env.example` committed).
- Logo: use the **actual logo asset from humblecoders.in** — export it from the live site or request the original file from the manager. Only if no asset is available, fall back to the prototype's text approximation (gold Caveat "Humble" + bold white "CODERS").

## ✅ Scope / What to build

- [ ] Scaffold `web/` (Vite React-TS template) + Tailwind, with **all theme tokens from CLAUDE.md defined once in the Tailwind config** — no ad-hoc hex in components.
- [ ] Sticky blurred header with the humblecoders.in logo (links to humblecoders.in) + "Project Booking" pill.
- [ ] Hero: "Pick Your API Project" (brand-accent on "API Project"), sub-copy, three stat pills (25 projects / 10 seats each / 1 per student), radial brand glow.
- [ ] Responsive card grid of all 25 projects: `Project NN` chip, key badge (green "No key needed" / gold "Free API key"), title, description, API link (new tab), seat progress bar + "N seats left" (amber ≤3), Book button (disabled "Fully Booked" at 0, card dimmed).
- [ ] Data layer: typed `get_projects` call, loading spinner, friendly error state, silent re-poll every ~45 s.
- [ ] Footer matching the prototype. Book button can be a no-op/console stub — the modal is ticket #4.

## 🎯 Acceptance Criteria

- [ ] `npm run build` passes with zero TS errors (strict mode) and the built site runs from `npm run preview`.
- [ ] Side-by-side with the prototype: same visual identity (a reviewer can't spot an off-brand color/spacing/typeface).
- [ ] Live seat counts render from the real backend; kill the network and a friendly error state appears.
- [ ] Layout verified at 375 px, 768 px, 1280 px — no horizontal scroll, cards reflow (1/2/3 columns).
- [ ] Full projects appear dimmed with disabled button; low-seat projects show amber state.
- [ ] No hex colors outside the Tailwind config; no `any` types in the data layer.

## 🚫 Out of scope

- Booking modal / OTP flow (ticket #4).
- Deployment (ticket #5).
- Any backend changes.

## 🔗 Dependencies

- Ticket #1 (live `get_projects`). UI work can start against mock data, but acceptance runs against the real backend.

## 📚 References

- `docs/PRD.md` §5.1 (catalogue spec) · `CLAUDE.md` (stack rules + theme tokens)
- `project-booking/index.html` (baseline) · https://humblecoders.in (brand source)

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 3
```
