# SY Reminders (production-ready starter)

## Setup
1. Copy env example:
```bash
cp .env.local.example .env.local
```

2. Fill env with your Supabase project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Install & run:
```bash
npm install
npm run dev
```

## Supabase Auth
Supabase → Auth → URL Configuration:
- Redirect URLs:
  - http://localhost:3000/app
  - http://localhost:3000/auth (optional)
  - https://YOUR-VERCEL-DOMAIN/app

## Deploying to Vercel (quick)

1. Push this repo to GitHub (or use existing remote).

2. On Vercel, click "Import Project" → GitHub → select repository.

3. In the Vercel project settings → Environment Variables add these keys:
- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
- `NEXT_PUBLIC_APP_NAME` = SY Reminders
- Optionally set `NEXT_PUBLIC_BASE_URL` to your Vercel deployment URL (e.g. `https://my-app.vercel.app`)

4. Deploy. After deployment, copy the Vercel domain (e.g. `https://my-app.vercel.app`) and add it to Supabase → Auth → Redirect URLs (include `/app`).

5. After verifying the app on Vercel works, you can edit files directly in GitHub and Vercel will redeploy automatically.

Notes:
- If you prefer temporary HTTPS tunneling during local dev, use `ngrok http 3000` and set `NEXT_PUBLIC_BASE_URL` to the generated URL. Add that URL to Supabase redirect list while testing.
- Keep your Supabase keys secret; only set anon key under `NEXT_PUBLIC_*` for client use.

## Data model
Uses your existing tables:
- `groups`
- `reminders`

Journal and Events are intentionally removed.

## Features included
- Magic link auth (Supabase)
- Dynamic timeline (React Query invalidate + optimistic toggle)
- Due date + time (or inbox)
- Groups + tags + Context mode (stored as tag `ctx:*`)
- Auto-reschedule for overdue tasks
- Calendar views: Day / Week / Month
- Weekly insights charts
