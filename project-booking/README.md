# Humble Coders — Project Booking

A single-page site where students pick one of 25 API-based Android projects and book it
with their registered email + a 6-digit code sent via Resend. Max 10 students per project,
one project per student, race-condition safe (enforced inside Postgres, not the browser).

```
project-booking/
├── index.html                          ← the whole website (host anywhere)
├── supabase/
│   ├── schema.sql                      ← tables + booking function + 25 projects seed
│   └── functions/
│       ├── send-otp/index.ts           ← emails the 6-digit code via Resend
│       └── sync-students/index.ts      ← pulls registered emails from Google Sheet
└── README.md
```

## How it stays safe without auth

- The web page can only call two database functions: `get_projects()` (read-only list)
  and `book_project(email, code, project_id)`. Row Level Security blocks everything else,
  so nothing can be forged from the browser.
- A booking only succeeds if the 6-digit code emailed to that address is correct — so
  nobody can book using someone else's email.
- The booking function locks the project row (`FOR UPDATE`) before counting seats:
  if 15 students tap "book" at the same instant, Postgres serializes them — exactly 10
  succeed, the rest get a clean "project full" message.
- One booking per email is enforced by a unique constraint (can't be raced either).
- OTP codes: stored hashed, expire in 10 minutes, max 5 wrong attempts, 60s resend cooldown.

## Setup (one time, ~20 minutes)

### 1. Supabase project
1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. Open **SQL Editor** → paste the whole of `supabase/schema.sql` → **Run**.
   This creates all tables and seeds the 25 projects.

### 2. Resend (for the OTP emails)
1. Create an account at [resend.com](https://resend.com) (free: 100 emails/day).
2. **Domains → Add Domain** → `humblecoders.in` → add the DNS records it shows you
   (at your domain registrar) → wait for "Verified".
   ⚠️ Without a verified domain, Resend only delivers to your own account email —
   student emails will fail.
3. **API Keys → Create API Key** — copy it.

### 3. Google Sheet (registered emails)
1. Make a sheet with student emails in a column (a header row is fine — anything
   that looks like an email gets picked up, everything else is ignored).
2. **File → Share → Publish to web** → choose the sheet + **CSV** → copy the link.

### 4. Deploy the edge functions
Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then from the
`project-booking/` folder:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set RESEND_API_KEY="re_..." \
  FROM_EMAIL="Humble Coders <projects@humblecoders.in>" \
  SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" \
  SYNC_SECRET="any-long-random-string"
supabase functions deploy send-otp
supabase functions deploy sync-students
```

### 5. Configure the web page
In `index.html`, fill in the two constants at the top of the `<script>` block:

```js
const SUPABASE_URL      = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";   // Settings → API → anon public key
```

(The anon key is designed to be public — RLS is what protects the data.)

### 6. Host it
`index.html` is fully self-contained. Host it anywhere:
- Netlify Drop / Vercel (drag & drop), or
- a page on humblecoders.in, e.g. `projects.humblecoders.in`.

## Day-to-day

- **Add students**: just add emails to the Google Sheet. The system re-syncs
  automatically whenever an unknown email requests a code, or force it anytime:
  `https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-students?secret=YOUR_SYNC_SECRET`
- **See who booked what**: Supabase dashboard → **Table Editor → bookings**.
- **Free a seat / undo a booking**: delete that student's row in `bookings`.
- **Change a capacity**: edit `capacity` in the `projects` table.
- **Reset everything**: `delete from bookings;` in the SQL editor.
