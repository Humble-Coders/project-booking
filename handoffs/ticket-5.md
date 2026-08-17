# Handoff — Ticket #5

**Ticket:** #5 — Deploy to projects.humblecoders.in + booking-day load rehearsal + runbook

**Branch:** `ticket-5-deploy-and-runbook` · **Base:** `main`

## Summary

The app is deployed and running in production on Vercel, wired to the live Supabase project, with SPA fallback so `/admin` works as a typed-in URL. Page metadata is complete: a real favicon and a 1200×630 OG card generated from the humblecoders.in logo, plus OG/Twitter tags and theme colour. The booking-day rehearsal was run against the deployed stack — 15 parallel bookings, exactly 10 winners and 5 clean `full` — and a real code-based booking moved the live seat count from 10 to 9 within two seconds in an open browser. Two accessibility defects found during the audit were fixed and redeployed (logo link name, and 25 API links below the WCAG 2.2 24 px target-size minimum), after which the audit is clean and every sampled contrast ratio passes AA. `project-booking/README.md` is rewritten as the v2 instructor runbook, and `web/README.md` documents local dev — a fresh clone following it produced a working build first try.

**Live now:** https://project-booking-hlanqo9h7-ishanks-projects-c4c57617.vercel.app
**Custom domain:** attached to the project, **waiting on two DNS records** (below) — the only thing standing between this and `projects.humblecoders.in`.

## Files changed

**Deploy config**
- `web/vercel.json` — new; framework `vite`, build/output, the catch-all rewrite to `/index.html` that makes `/admin` deep-links work, and immutable caching for hashed assets.
- `web/.gitignore` — Vercel CLI additions (`.vercel`, `.env*`) so deploy state and secrets stay untracked.

**Metadata / assets**
- `web/index.html` — title, description, favicon + apple-touch-icon links, full OG + Twitter card tags, `theme-color`.
- `web/public/favicon.png`, `favicon.ico`, `og-image.png` — generated from `src/assets/humble-logo.png` on the brand background; the Vite default `favicon.svg` is deleted.

**Accessibility fixes (found by the production audit)**
- `web/src/components/Header.tsx` — explicit `aria-label` on the logo link.
- `web/src/components/ProjectCard.tsx` — `py-1` on the API link so its tap target reaches 24 px.

**Docs**
- `project-booking/README.md` — rewritten as the operations runbook (see below).
- `web/README.md` — new; clone → install → `.env` → dev/build/preview, the CI build command, deploy instructions, and a map of where logic lives.

## How to test

1. **Production, as a student:** open the live URL — catalogue loads over HTTPS, seat counts live. Enter a seeded code in any project's modal → success shows the email + project.
2. **Deep link:** open `<url>/admin` directly (not by clicking) — the gate screen renders, no 404.
3. **Rehearsal:** `SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/concurrency-test.mjs 20` → `ALL CHECKS PASSED`, exactly 10 winners. **Do not pipe this to `head`** — it kills the script before its cleanup step (learned the hard way; leftovers had to be deleted manually).
4. **Realtime:** with the live site open, insert a booking with the service role → the count drops within ~2 s.
5. **Fresh clone:** `git clone`, `cd web`, `npm install`, `cp .env.example .env` + fill, `npm run build` → builds clean.

## Acceptance criteria

- ⚠️ **`https://projects.humblecoders.in` loads over HTTPS; `/admin` direct URL works; real booking completes on production** — *partially met.* Everything is verified working on the production deployment (HTTPS, `/admin` deep link returning 200 with app HTML, real booking with code `PRQD8N` → "Pokédex Lite"), but at the Vercel URL: the custom domain needs DNS records only the manager can add (below).
- ✅ **Production rehearsal: exactly 10 of 15 succeed; realtime counts observed live** — ran against the deployed stack: 10 ok / 5 `full`, `bookings` = 10, `seat_counts.booked` = 10, plus the full error contract and RLS checks. Separately, a live booking moved Pokédex Lite 10 → 9 in an open browser within 2 s.
- ✅ **Accessibility ≥ 90 / fast on mobile** — programmatic axe-style audit: zero issues after the two fixes (images have alt, all controls named, inputs labelled, `lang` set, single `h1`, no undersized tap targets). Contrast sampled across six text roles: 4.53–18.41:1, all passing AA. Page load 1.5 s. *Note: this is an equivalent audit run in-browser, not the Lighthouse CLI binary — the numeric Lighthouse score was not produced.*
- ⚠️ **Instructor completes the runbook loop unaided** — the runbook is written and every step in it has been executed at least once during tickets #2/#4/#6 (sync excepted). The end-to-end unaided run belongs to the manager, and its first step (**sheet sync**) still needs `SHEET_CSV_URL`.
- ✅ **Fresh clone + documented steps reproduce a working local setup** — cloned this branch into a temp dir, followed `web/README.md` verbatim, `npm run build` succeeded.

## Deviations / decisions

- **Deployment protection had to be disabled.** Vercel enables SSO protection on new team projects by default, which returned 302 to a login wall for every public URL — fatal for a student-facing site. Turned off for this project (`ssoProtection: null`); the app's own security is unchanged (RLS + the admin secret).
- **Custom domain attached via the API, not the CLI.** `vercel domains add` returned 403 because the account doesn't own `humblecoders.in`; the project-scoped API attaches the subdomain and returns the verification record instead.
- **Favicon/OG images generated locally with PIL** from the existing logo asset rather than sourced separately — keeps the brand mark authoritative and avoids a new binary dependency.
- **Global `npm i -g vercel` needs sudo on this machine**, so all Vercel commands run via `npx vercel@latest`. Documented that way in `web/README.md`.
- **Runbook rewritten from scratch, not edited.** The v1 file described the dead email+OTP flow; the project ref, secrets list, and every day-to-day procedure changed. It now also warns never to hand-edit `seat_counts` (carried from ticket #1's review).

## Open questions / follow-ups

- **DNS — needs the manager.** `humblecoders.in` is at **Namecheap** (Advanced DNS tab). Add, without removing the existing `_vercel` TXT that belongs to the main site:

  | Type | Host | Value |
  |---|---|---|
  | CNAME | `projects` | `e270558db9cbb9fc.vercel-dns-017.com.` |
  | TXT | `_vercel` | `vc-domain-verify=projects.humblecoders.in,1dc76805b7eec9185ca8` |

  HTTPS is issued automatically once both resolve. Note the apex `humblecoders.in` is verified in a *different* Vercel account (the main site), which is why the subdomain needs its own TXT.
- **`SHEET_CSV_URL` still unset** — blocks the runbook's first loop and the last criterion of ticket #6.
- The Lighthouse numeric score was not captured (no CLI binary available here); if the manager wants the official number, running `npx lighthouse <url> --preset=desktop` locally takes a minute.
- Vercel is not connected to the GitHub repo, so deploys are manual (`npx vercel --prod`). Connecting the repo would give automatic deploys per push — a manager call, documented in the runbook as-is.
