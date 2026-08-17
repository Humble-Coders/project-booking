# Handoff — Ticket #4

**Ticket:** #4 — Build the code-only booking flow

**Branch:** `ticket-4-booking-flow` · **Base:** `main`

## Summary

Wired the catalogue's Book buttons to a full code-only booking flow: an accessible modal (focus trap, Esc/overlay close, Enter submits, close locked while a request is in flight) with a single filtered 6-char input, one `book_project` RPC call, and exhaustive result views for the fixed error contract plus network failure — each with PRD §5.2 copy. Success and `already_booked` both write the cosmetic "You've booked X" localStorage note that renders as a banner (server remains truth; the note self-corrects). Every attempt outcome force-syncs seat counts via a new `useProjects.refresh()`, so even polling-fallback clients see the consequence instantly. The entire flow was verified live at 375 px against the deployed backend: real booking, superseded-code rejection, `already_booked` with held project, `full` with instant card flip, a two-window last-seat race, and mid-flow refresh.

## Files changed

**Data layer (`web/src/lib`)**
- `booking.ts` — typed `bookProject()` with a discriminated `BookResult` union over the fixed contract (`invalid_code | already_booked | full | no_project`) + `network`; `sanitizeCode()` (uppercase, `A-Z2-9` minus O/I, 6-char cap) shared with the input. Unrecognized server errors collapse to `network` rather than inventing contract codes.
- `myBooking.ts` — guarded localStorage get/set for the cosmetic note (private-mode Safari can throw).

**UI (`web/src/components`, `hooks`, `pages`)**
- `BookingModal.tsx` — the modal: form step (filtered input, Confirm disabled until 6 chars, "Booking…" pending state, Cancel) and result step (success + five error views, PRD copy tone).
- `useFocusTrap.ts` — Tab cycling within the dialog, Esc callback, focus restore on close; hooks only, no UI kit.
- `MyBookingBanner.tsx` — prototype-style gradient banner strip.
- `Catalogue.tsx` — replaces the ticket-#3 stub: opens the modal, re-reads the note on close, renders the banner.
- `useProjects.ts` — exposes `refresh()` (the existing fetch) for the modal's force-sync on every outcome.

## How to test

1. `cd web && npm install && npm run dev`; seed a student with a known code (service role):
   `code_hash = sha256("HJ4K7M")` → `printf 'HJ4K7M' | shasum -a 256`, insert into `students` via the dashboard/REST. (With ticket #2 deployed, `admin send_code` + the real email works too.)
2. Book: pick a project → enter the code (try lowercase and junk characters — they filter live) → Confirm → success shows **email + project**; banner appears and survives reload.
3. Error tour: wrong code → `invalid_code` copy · overwrite the student's `code_hash` (simulates resend), old code → `invalid_code` · new code → `already_booked` + held project · set a test project's capacity to 0 → `full`, card flips to "Fully Booked" immediately.
4. Race: set capacity so 1 seat remains; open two windows; open the modal in both; confirm in one (wins) then the other (`full`, count already moved).
5. Restore capacity 10 and delete test rows after.

## Acceptance criteria

- ✅ Real booking with a seeded code from a 375 px viewport; success screen showed `flow-test-a@example.invalid` + "Weather Now".
- ✅ Wrong code → `invalid_code` copy; superseded code (hash overwritten server-side) → `invalid_code`; same student again → `already_booked` + "Weather Now"; capacity-0 project → `full` with the card flipping to "Fully Booked"/disabled immediately (force-sync observed).
- ✅ Two-window race on the last seat: window A won ("Seat booked"), window B — which had the modal open before the seat vanished — got the friendly `full` and the count had already moved behind it.
- ✅ Mid-flow refresh (modal open, code half-typed): page reloads clean, 25 cards, no modal, banner intact; nothing corrupted (state is client-only, booking truth is in Postgres).
- ✅ `npm run build` clean (strict); layout verified at 375 px live; 768/1280 unchanged from ticket #3 (modal is a fixed `max-w-[430px]` overlay).
- ✅ Typed API layer; hygiene greps clean (no hex outside `@theme`, no `any`).

## Deviations / decisions

- **Input filtering also excludes O/I** (full PRD alphabet) — the ticket said "A-Z2-9 filter"; the stricter alphabet matches what the backend generates and prevents un-typeable characters.
- **`network` added as a client-side result variant** — not a server contract change (out of scope); it covers fetch failure and any unrecognized payload defensively.
- **Banner note is also written on `already_booked`** — self-corrects cleared/foreign browsers, per the walkthrough discussion; server response is the source.
- **Modal close is blocked while a request is pending** — prevents "did it book?" ambiguity; Esc/overlay/Cancel all respect it.
- **Verification interaction used JS-dispatched clicks** for some steps — the in-app browser's mobile touch emulation turned coordinate clicks into text selections (driver artifact); the dispatched events exercise the identical React handlers. Typing, focus, Enter, and rendering were exercised natively.

## Open questions / follow-ups

- The `full` view invites "pick another project" but simply closes to the grid — a possible later nicety is auto-scrolling to available projects. Not in scope.
- `already_booked` currently reuses the localStorage note for the banner project name; if the instructor deletes a booking (runbook flow), the stale banner persists until the student's next booking attempt. Cosmetic by design; noting for ticket #5's runbook.
