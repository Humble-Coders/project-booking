# Humble Coders — Project Booking · operations runbook

Everything the instructor needs to run the system, start to finish. No coding required
for day-to-day use — this is all dashboard buttons, one spreadsheet, and (rarely) the
Supabase table editor.

- **Student site:** https://projects.humblecoders.in
- **Your dashboard:** https://projects.humblecoders.in/admin (needs the admin secret)
- **Data:** Supabase project `okytacrlhmvxaxfpnynb` · **Email:** Resend · **Registry:** a Google Sheet

## How it works in one minute

Students never sign in. Before booking day you email each student a **personal 6-character
code** from the dashboard. On booking day they open the site, pick a project, type their
code, and the seat is theirs. The code *is* their identity.

Three rules are enforced inside the database itself — the website cannot bend them, and
neither can anyone poking at it from a browser console:

- **10 seats per project.** The booking function locks the project row before counting, so
  if 15 students tap Confirm at the same instant, exactly 10 succeed and the rest get a
  clean "that seat just went".
- **One booking per student**, enforced by a unique constraint.
- **Codes are stored hashed**, never in plain text. Resending a code overwrites the old one,
  so the newest email always wins and the previous code dies instantly.

---

## Where things live

```
web/                         ← the live site (React app deployed to Vercel)
project-booking/
├── supabase/
│   ├── schema.sql           ← tables, the two public functions, 25-project seed
│   └── functions/
│       ├── admin/           ← everything the dashboard does
│       ├── _shared/sheet.ts ← Google Sheet CSV parsing
│       └── sync-students/   ← backup sheet sync via secret URL
├── index.html               ← ARCHIVED prototype. Visual reference only; its
│                              email+OTP booking flow is dead. Do not deploy it.
└── README.md                ← this runbook
scripts/                     ← concurrency + admin test scripts (developer tools)
```

---

## One-time setup (already done — for reference or a rebuild)

1. **Supabase** — create a project (free tier, region `ap-south-1`), open **SQL Editor**,
   paste all of `supabase/schema.sql`, Run. Safe to re-run; it creates the tables, the two
   public functions, the realtime seat feed and seeds the 25 projects.
2. **Resend** — create an account, add **humblecoders.in** under Domains, add the DNS records
   it shows you, wait for "Verified". Until it's verified, emails only reach your own address.
   Then create an API key.
3. **Google Sheet** — put student emails in a column (headers and other columns are fine —
   anything email-shaped is picked up, everything else ignored). **File → Share → Publish to
   web → CSV**, copy the link.
4. **Secrets** — from the `project-booking/` folder:
   ```bash
   supabase secrets set \
     RESEND_API_KEY="re_..." \
     FROM_EMAIL="Humble Coders <projects@humblecoders.in>" \
     SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" \
     SYNC_SECRET="<long random string>" \
     ADMIN_SECRET="<long random string>" \
     --project-ref okytacrlhmvxaxfpnynb
   supabase functions deploy admin --project-ref okytacrlhmvxaxfpnynb --use-api
   supabase functions deploy sync-students --project-ref okytacrlhmvxaxfpnynb --use-api --no-verify-jwt
   ```
   Keep `ADMIN_SECRET` somewhere safe — you type it into the dashboard once per browser.

---

## Running a semester

### 1. Put the students in the sheet
Add their emails to the Google Sheet. Nothing else is required — no names, no order.

### 2. Sync the sheet
Dashboard → **Sync sheet**. New emails appear in the students table with **No code yet**.
Syncing never deletes anyone; removing a row from the sheet does not remove the student.

*(Backup route if the dashboard is unavailable: open
`https://okytacrlhmvxaxfpnynb.supabase.co/functions/v1/sync-students?secret=<SYNC_SECRET>`
in a browser.)*

### 3. Send the codes
Dashboard → **Send codes to all pending (N)** → confirm. Each student gets a branded email
with their personal code, and their row flips to **Sent**.

> **Watch the daily cap.** Resend's free plan allows **100 emails/day**. With ~250 students,
> send in batches across three days — for example one class section per day. The button always
> targets only students with no code yet, so running it again tomorrow picks up exactly the
> ones you haven't done. If a send run hits the cap, the dashboard says so explicitly and
> names who failed; just re-run it the next day.

### 4. Watch delivery
Dashboard → **Refresh delivery statuses** (Resend takes a few seconds to report):

| Chip | Meaning | What to do |
|---|---|---|
| No code yet | never sent | send it |
| Sent | accepted by Resend | refresh again in a minute |
| Delivered | it reached their inbox | nothing |
| Bounced | address doesn't exist | fix the email in the sheet, sync, send again |
| Failed | Resend rejected the send | usually the daily cap — retry tomorrow |

### 5. Booking day
Students go to https://projects.humblecoders.in, pick a project, enter their code. Seat
counts update live for everyone watching. Nothing is needed from you — **no emails are sent
on booking day**, so the daily cap is irrelevant here.

Keep the dashboard open if you like: it refreshes itself every minute, and the projects
panel shows exactly who booked what.

### 6. "I never got my code" / "I lost it"
Find the student (search box) → **Resend** on their row. They get a fresh code immediately;
their old code stops working the moment the new one is generated. There is no way to get
this wrong, so resend freely.

---

## Fixing things

**See who booked what** — dashboard, projects panel. Or Supabase → **Table Editor → bookings**.

**Free a seat / undo a booking** — Supabase → Table Editor → `bookings` → delete that student's
row. The seat count on the live site drops within a couple of seconds, and the student can book
again with their existing code. *(The student's browser may still show a "you've booked X"
banner — it's cosmetic and clears as soon as they book again.)*

**Change a project's capacity** — Table Editor → `projects` → edit `capacity` for that row.
Lowering it below the number already booked doesn't cancel anyone; it just blocks new bookings.

**Add a student mid-semester** — add them to the sheet → **Sync sheet** → **Resend** on their row
(or "send to all pending" if there are several).

**A student booked the wrong project** — delete their `bookings` row; they rebook with the same code.

**Never edit `seat_counts` by hand.** It is maintained automatically from `bookings`; editing it
directly makes the live counts wrong until the next booking corrects them.

**Reset for a new semester** — in the Supabase SQL editor:
```sql
delete from bookings;                 -- frees every seat
update students set code_hash = null, code_sent_at = null,
       resend_email_id = null, delivery_status = 'none';   -- retires all codes
-- or, to start from an empty roster:
-- delete from students;
```
Then update the sheet, sync, and send codes as in steps 1–3.

---

## Redeploying the site

The site is a static build hosted on Vercel. After any code change:

```bash
cd web
npm install
npx vercel --prod
```

The two `VITE_*` environment variables are stored in the Vercel project; the admin secret and
all email/sheet secrets live only in Supabase and are never part of the site bundle.

To redeploy the backend functions after editing them:

```bash
cd project-booking
supabase functions deploy admin --project-ref okytacrlhmvxaxfpnynb --use-api
```

---

## Safety notes

- The anon key in the site is public **by design** — the database is protected by row-level
  security plus a two-function public surface, not by hiding that key.
- Plain-text codes exist only inside the emails. The database stores hashes, and nothing is
  ever logged.
- The dashboard holds no privileged logic: it just calls the admin function with your secret.
  If someone opens `/admin` without it, they see a locked screen and no data.
- Anyone who has your **admin secret** can send codes and read the student list — treat it
  like a password, and use the **Log out** button on shared machines.
