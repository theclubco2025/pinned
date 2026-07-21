# Pinned

Turn your store into a map customers can ask questions to. Set it up in minutes.

Grocery, hardware, pharmacy, garden center, liquor, bookstore — any store with aisles.

## Features

- Try-before-signup onboarding with local draft mode
- Store-type-first setup (grocery, hardware, pharmacy, etc.)
- Structured floor plan templates with labeled aisles/zones
- Customer wayfinding — animated route from entrance to product pin
- AI auto-placement of products onto floor plan zones
- Floor plan templates or photo upload (camera supported on mobile)
- Product paste, CSV import, and category starter packs
- Speed tagger and bulk aisle/zone tagging
- AI-powered customer Q&A with instant pin on store map
- Printable QR poster for entrance display
- Owner analytics dashboard
- Staff mode for unmatched customer questions
- White-label branding (logo + accent color)
- Web push daily summaries for store owners

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Prod | Canonical site URL for auth redirects |
| `CLAUDE_PINNED` or `ANTHROPIC_API_KEY` | Yes | Claude API key for product matching |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional | Web push public key |
| `VAPID_PRIVATE_KEY` | Optional | Web push private key |
| `VAPID_SUBJECT` | Optional | mailto: contact for push |
| `CRON_SECRET` | Optional | Bearer token for cron routes |

### 3. Supabase migrations

Run SQL migrations in order against your Supabase project:

1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_analytics_and_staff.sql`
3. `supabase/migrations/003_branding_and_push.sql`
4. `supabase/migrations/004_store_type.sql` — adds `store_type` on stores and optional `category` on products
5. `supabase/migrations/005_floor_scan.sql` — adds `floor_scan` + `floor_plan` JSONB for the future LiDAR/native scan pipeline (safe to run now; optional)

In Supabase Dashboard: SQL Editor → paste each file → Run.

Also disable "Confirm email" under Authentication → Email if you want instant signup.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### 5. Deploy on Vercel

1. Push to GitHub and import in Vercel
2. Add all env vars from `.env.example`
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL
4. Optional: add Vercel Cron for `/api/notifications/daily-summary` (daily at 9am)

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # start production server
npm run lint     # ESLint
```

## License

Proprietary — All Rights Reserved. See [LICENSE](LICENSE).
