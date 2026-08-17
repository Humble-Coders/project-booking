# Handoff — Ticket #3

**Ticket:** #3 — Scaffold web/ React app + catalogue UI with realtime seats (humblecoders.in brand)

**Branch:** `ticket-3-catalogue-ui` · **Base:** `main`

## Summary

Scaffolded the `web/` app (Vite + React 19 + TypeScript strict + Tailwind v4) and built the full public catalogue: sticky blurred header with the **real humblecoders.in logo** (pulled from the live site), hero with radial brand glow and stat pills, responsive 25-card grid, and footer — all matching the prototype, with every brand token defined once in the Tailwind `@theme` block and zero hex anywhere else. The data layer is a single `useProjects` hook merging `get_projects` with the realtime `seat_counts` subscription; any channel failure silently tightens polling to 15 s + jitter and retries the join every 30 s in the background. Realtime, fallback, and rejoin were all proven live against the deployed backend in the in-app browser. Routes `/` and `/admin` (shell) are in place; the Book button is a stub for ticket #4.

## Files changed

**App scaffold (`web/`)**
- `package.json` / lockfile / `tsconfig*.json` / `vite.config.ts` — Vite React-TS scaffold + `@tailwindcss/vite`, `@supabase/supabase-js`, `react-router-dom`; strict TS.
- `index.html` — title, Inter + Caveat fonts (same as prototype).
- `src/index.css` — **all CLAUDE.md tokens** as Tailwind `@theme` vars: the only hex in `src/`.
- `.env.example` (committed) — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` per CLAUDE.md naming.

**Data layer (`web/src/lib`, `web/src/hooks`)**
- `lib/types.ts` — `Project`, `SeatCountRow`, `SeatFeedMode`; no `any` anywhere.
- `lib/supabase.ts` — typed client; dev-only `window.__supabase` hook (guarded by `import.meta.env.DEV`) used to exercise the fallback in tests.
- `hooks/useProjects.ts` — the seats store: initial RPC load, realtime patch-in, 45 s lazy poll when healthy, 15 s + 0–6 s jitter fallback on any non-`SUBSCRIBED` status, silent 30 s rejoin loop, error state only when there is nothing to show.

**UI (`web/src/components`, `web/src/pages`)**
- `Header/Hero/ProjectCard/Footer/LoadStates` — prototype visuals in Tailwind token classes; card: project chip, green/gold key badge, gradient seat bar (amber ≤3), red "Fully booked" + dimmed card + disabled button at 0.
- `pages/Catalogue.tsx` — composition + `onBook` stub (console.info); `pages/Admin.tsx` — route shell for ticket #6; `App.tsx` — the two routes.

**Tooling (root)**
- `.claude/launch.json` — dev-server config for the in-app preview.

## How to test

1. `cd web && cp .env.example .env` — fill from the root `.env` (same URL; the publishable key is the anon key).
2. `npm install && npm run build` — must pass with zero TS errors; `npm run preview` (or `npm run dev`) serves the site.
3. **Realtime:** with the site open, insert a booking (service role) for any project — its count moves within ~2 s, no refresh. Delete the row — the count snaps back.
4. **Fallback:** in the browser console: `window.__supabase.realtime.disconnect()` (dev build), then insert a booking → count updates within ~21 s via polling, no visible error; within ~30 s more, `window.__supabase.realtime.isConnected()` returns `true` again on its own.
5. Resize 375 / 768 / 1280 px — 1 / 2 / 3 columns, no horizontal scroll.

## Acceptance criteria

- ✅ `npm run build` zero TS errors (strict); preview serves the site.
- ✅ Realtime proof: booking inserted server-side moved "Country Explorer" 10 → 9 in the open window without refresh (and back to 10 on delete).
- ✅ Fallback proof: socket disconnected via the dev hook → a new booking still appeared through the 15 s + jitter poll with **no visible error**; the app rejoined realtime automatically (~30 s) and resumed live updates.
- ✅ Visual identity vs prototype: same layout/palette/typography; **real logo asset** (`images/humble.png` from the live site) in header; Caveat+bold text mark in footer.
- ✅ 375 / 768 / 1280 px verified in-browser: 1 / 2 / 3 columns, `scrollWidth === clientWidth` at each.
- ✅ Full → dimmed (55 %) + disabled "Fully Booked"; ≤3 seats → amber bar/text; initial-load failure → friendly error + retry (retry path exercised by code review; kill-network case not manually run).
- ✅ Greps clean: no hex outside `index.css` `@theme`; no `any` in `src/`.

## Deviations / decisions

- **Tailwind v4** (CSS-first `@theme`) rather than v3's `tailwind.config.js` — same "tokens defined once" guarantee, current default for new Vite scaffolds.
- **React 19** — what `create vite` ships today; ticket said 18+, hooks-only rules unchanged.
- **Dev-only `window.__supabase` hook** added for the fallback acceptance test; `import.meta.env.DEV`-guarded, absent from production bundles.
- **Realtime DELETE events also handled** (count snaps back when the instructor frees a seat) — falls out of subscribing to `event: '*'`.
- **`web/.env` duplicates the root values** — Vite only reads env from its own root; `.env.example` documents it.

## Open questions / follow-ups

- The error-state "network killed" case was verified by code path, not by an actual offline run — trivial to eyeball in review (`LoadStates.tsx`).
- `feedMode` is exposed by the hook but unused by the UI (spec: students never see transport state) — ticket #6's dashboard could surface it for the instructor.
- Ticket #4 (booking modal) plugs into `Catalogue.tsx`'s `handleBook` stub.
