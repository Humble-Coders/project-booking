# web/: the Project Booking site

Vite + React 19 + TypeScript (strict) + Tailwind v4. Two routes:

- `/`: public catalogue, 25 projects, live seat counts, booking modal.
- `/admin`: instructor dashboard (gated by the admin secret, not linked from `/`).

## Local development

```bash
git clone https://github.com/Humble-Coders/project-booking.git
cd project-booking/web
npm install
cp .env.example .env      # then fill in the two values below
npm run dev               # http://localhost:5173
```

`.env` needs exactly two values, both from Supabase → **Project Settings → API**:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
```

Both are public by design; the database is protected by RLS plus the two-function
public surface, not by hiding this key. Never put the service-role key, the admin
secret, or the Resend key in here; they live only in Supabase edge-function secrets.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check (strict) + production build into `dist/` (the CI/deploy command) |
| `npm run preview` | Serve the built `dist/` locally, as production would |
| `npm run lint` | Lint the source |

`npm run build` fails on any TypeScript error, so it doubles as the type-check step in CI.

## Deployment

Vercel, configured by [`vercel.json`](vercel.json): framework `vite`, build `npm run build`,
output `dist/`, and a catch-all rewrite to `/index.html` so `/admin` works as a typed-in URL
(without it, deep links 404). The two `VITE_*` values are set as Vercel environment variables.

To redeploy from this folder:

```bash
npx vercel --prod
```

## Where the logic lives

```
src/
├── lib/
│   ├── supabase.ts      client singleton
│   ├── types.ts         Project / seat-count shapes
│   ├── booking.ts       book_project call + code sanitising + result contract
│   ├── myBooking.ts     cosmetic "you booked X" note (localStorage)
│   ├── admin.ts         typed client for the admin edge function
│   └── adminSecret.ts   admin secret storage (localStorage only, never bundled)
├── hooks/
│   ├── useProjects.ts     catalogue + realtime seats + polling fallback
│   ├── useAdminOverview.ts dashboard data + 60s auto-refresh
│   ├── useFocusTrap.ts     modal accessibility
│   └── useToast.ts
├── components/          catalogue UI + components/admin/ for the dashboard
└── pages/               Catalogue.tsx, Admin.tsx
```

Brand tokens (colours, radius, fonts) are defined once in `src/index.css` under `@theme`.
Components use token classes; no raw hex appears anywhere else.
