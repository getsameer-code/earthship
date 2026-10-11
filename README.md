# EarthShip

Pledge site + lightweight CRM for a crowdsourced network of private nature reserves.
Next.js (App Router) · Postgres (Drizzle) · deploy on Vercel.

## Setup
1. Create a Postgres DB (Neon via the Vercel Marketplace). Copy `.env.example` to `.env.local` and fill it in.
2. `npm install`, then create tables with `npm run db:push`, or run the SQL files in `drizzle/` in order (needed when DB credentials can't be pulled locally).
3. Seed the first admin: `INSERT INTO admins (email) VALUES ('you@gmail.com');`
4. Google sign-in: create an OAuth Web client with redirect URI `<SITE_URL>/api/auth/google/callback`; set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SITE_URL`. More admins can be added at `/admin/team`.
5. `npm run dev`, then open `/pledge` and `/login` (team CRM at `/admin`).
6. Deploy: import the repo in Vercel and set the same env vars.

## Where things live
- `src/lib/config.ts`: tier names/amounts (placeholders!), interests, statuses, segments.
- `src/db/schema.ts`: contacts, pledges, interactions, admins.
- `src/app/pledge`: public pledge form. `src/app/admin`: CRM (list, contact detail, log, CSV export).

Pledges are non-binding; no payments are taken. Add Razorpay later once the trust/Section 8 exists.
# earthship
