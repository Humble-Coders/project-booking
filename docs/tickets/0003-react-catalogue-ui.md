## 📖 Story / Why

This is the face of the product: a page students open, instantly recognize as Humble Coders, and browse 25 project ideas — **no code, no email, no barrier**. Seat counts move **live** while classmates book, which is what makes booking day feel fair and urgent. Must look like a natural extension of humblecoders.in (same logo, palette, typography) and work beautifully from a 375 px phone to a desktop.

## 🧭 Context

- Fresh React app in `web/` — **Vite + React 18 + TypeScript (strict) + Tailwind** (locked in `CLAUDE.md`; hooks only, no Redux, no UI kit, `@supabase/supabase-js`). Light routing for `/` (this ticket) and `/admin` (ticket #6 adds the page; you add the route shell).
- Visual baseline: the prototype at `project-booking/index.html` — match its look, **not** its booking flow (that changed; see PRD v2).
- Data: `rpc/get_projects` for the initial load + **Supabase Realtime subscription on `seat_counts`** for live updates (ticket #1 provides both). Polling fallback ~45 s if the channel drops.

## 🔑 Access & prerequisites

- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — from the manager (public-safe; still `.env`, with `.env.example` committed).
- Logo: use the **actual logo asset from humblecoders.in** — export from the live site or request from the manager. Fallback only if unavailable: prototype's text mark (gold Caveat "Humble" + bold "CODERS").

## ✅ Scope / What to build

- [ ] Scaffold `web/` (Vite React-TS) + Tailwind with **all CLAUDE.md theme tokens in the Tailwind config** — no ad-hoc hex in components.
- [ ] Sticky blurred header (real logo → links to humblecoders.in) + "Project Booking" pill.
- [ ] Hero: "Pick Your API Project" (brand accent), sub-copy, stat pills (25 projects / 10 seats each / 1 per student), radial brand glow.
- [ ] Responsive card grid of all 25: `Project NN` chip, key badge (green "No key needed" / gold "Free API key"), title, description, API link (new tab), seat bar + "N seats left" (amber ≤3), Book button (disabled "Fully Booked" at 0, card dimmed).
- [ ] Data layer: typed `get_projects` + realtime `seat_counts` subscription merged into one seats store; loading spinner; friendly error state; polling fallback.
- [ ] Footer matching the prototype. Book button opens nothing yet (modal is ticket #4) — wire a stub.

## 🎯 Acceptance Criteria

- [ ] `npm run build` passes with zero TS errors (strict); `npm run preview` serves the working site.
- [ ] **Realtime proof:** two browser windows open; a booking made in one (via script or SQL insert) moves the seat count in the other within ~2 s, no refresh.
- [ ] Side-by-side with the prototype: same visual identity (no off-brand color/spacing/typeface), real humblecoders.in logo in place.
- [ ] Layout verified at 375 / 768 / 1280 px — no horizontal scroll; grid reflows 1/2/3 columns.
- [ ] Full projects dimmed + disabled; ≤3 seats shows amber; network killed → friendly error state.
- [ ] No hex outside the Tailwind config; no `any` in the data layer.

## 🚫 Out of scope

- Booking modal (ticket #4) · Admin dashboard page (ticket #6) · Deployment (ticket #5) · Backend changes.

## 🔗 Dependencies

- Ticket #1 (live `get_projects` + realtime). UI can start on mock data; acceptance runs against the real backend.

## 📚 References

- `docs/PRD.md` §5.1 · `CLAUDE.md` (stack rules + tokens) · `project-booking/index.html` (visual baseline) · https://humblecoders.in (brand + logo source)

## 🤖 Kickoff prompt (paste into Claude Code)
```
/start-ticket 3
```
