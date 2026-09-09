# FindJos

FindJos is a mobile-first local marketplace and discovery engine for Jos. This
first skeleton uses dummy Terminus listings so the product flow can be tested
before Supabase is connected.

## Start locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Demo routes:

- `/`: public anonymous marketplace
- `/login`: seller or administrator demo sign-in
- `/seller`: seller dashboard
- `/admin`: administrator dashboard

The local demo intentionally does not store or validate credentials yet. The
sign-in form routes to the selected workspace so the product workflow can be
reviewed when no environment variables exist. Once Supabase variables are
present, the same form uses Supabase Auth, seller sign-up, session cookies, and
middleware role checks.

## Current structure

- `app/page.tsx`: public marketplace shell, search state, and view routing.
- `app/data.ts`: typed mock listings and category data.
- `app/components/BusinessCard.tsx`: public listing card and contact actions.
- `app/components/BottomNav.tsx`: thumb-friendly mobile navigation.
- `app/components/SellerPanel.tsx`: seller-facing profile and dashboard preview.
- `app/admin/page.tsx`: administrator listing control workspace.
- `app/seller/page.tsx`: seller profile, inventory, and insight workspace.
- `app/login/page.tsx`: role-aware demo sign-in entry point.
- `app/globals.css`: responsive marketplace visual system.
- `public/manifest.webmanifest`: installable PWA metadata.
- `public/sw.js`: minimal network-first service worker foundation.

Functions in the UI include comments describing their responsibility. The
search and saved-list state is intentionally local for now; Supabase will later
replace these interfaces with authenticated queries and row-level permissions.

## Planned Supabase handoff

The first backend tables should be `profiles`, `businesses`, `categories`,
`products`, `claims`, and `reports`. A profile role will distinguish `admin`,
`seller`, and optional `viewer`. Anonymous users can read published businesses;
only admins can publish or verify listings; sellers can edit businesses they own
through a pending-review workflow.

Run `supabase/schema.sql` in the Supabase SQL Editor to create these tables,
triggers, indexes, seed categories, storage, and row-level security policies.
If you already ran an older version of the schema, run these files in order:

```text
supabase/migrations/002_persistence_workflows.sql
supabase/migrations/003_security_and_reviews.sql
```

After the first account is created, promote it from the SQL Editor with:

```sql
update public.profiles
set role = 'admin'
where id = 'AUTH_USER_UUID';
```

To load the fictional Terminus demo records into the connected database, run
`supabase/seed.sql` after the schema. It is safe to run more than once because
the seed uses unique slugs and checks for existing products.

Never expose a Supabase service-role key in the browser or commit it to the
repository. Only the public URL and anon/publishable key belong in `.env.local`
and Vercel environment variables.

## Deployment

Import this repository into Vercel. The free preview URL will provide the first
shareable demo. Add Supabase environment variables only when the backend is
ready:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Copy `.env.example` to `.env.local`, fill the two values, then restart the dev
server. Without those values the UI intentionally remains usable with fictional
Terminus data.
