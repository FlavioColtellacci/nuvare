# Nuvare

Nuvare is a Next.js app for cross-border compliance and financial intelligence.  
It includes onboarding, AI guidance, deadline tracking, country intelligence, document vault, notifications, and Stripe-based subscriptions.

## Tech stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase (auth + data)
- Stripe (checkout + webhooks)
- Anthropic + Perplexity integrations

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Environment: copy `.env.example` to `.env.local` and fill in values, or run `npx vercel env pull .env.local` with the project linked. See `.env.example` and the list below.
3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Required in `.env.local` (template: `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `PERPLEXITY_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CORE_MONTHLY_PRICE_ID`
- `STRIPE_CORE_YEARLY_PRICE_ID`
- `STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID`
- `STRIPE_PROFESSIONAL_YEARLY_PRICE_ID`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `CRON_SECRET`

**App URL vs base URL:** `NEXT_PUBLIC_APP_URL` is what the app uses today (e.g. Stripe checkout `success_url` / `cancel_url`, local dev: `http://localhost:3000`). `NEXT_PUBLIC_BASE_URL` is not read anywhere in this repo; keep it only if you wire it yourself or use it in deployment config.

**Stripe publishable key:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is reserved for future client-side Stripe.js / Elements. Checkout today uses server-side `STRIPE_SECRET_KEY` only.

**Optional rate limiting (Upstash Redis):** When both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, `POST /api/ask` and `POST /api/vault/upload` apply per-user (or per-IP for unauthenticated ask) limits. If either variable is missing, limiting is skipped so local dev stays unchanged.

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint`, and `npm run build` on pushes and pull requests to `main`. The workflow sets **non-secret placeholder** `NEXT_PUBLIC_*` and Stripe price ID env vars so the build succeeds without repository secrets. You do not need to add GitHub Actions secrets for that job unless you change the workflow to require real keys.

## Scripts

- `npm run dev` - run local development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Project structure

- `app/` - routes, pages, and API handlers
- `components/` - shared UI and app components
- `lib/` - service clients and helper utilities
- `public/` - static assets

## Notes

- Keep generated artifacts (`.next/`, `node_modules/`, `tsconfig.tsbuildinfo`) out of commits.
- This repo intentionally uses a dark, premium UI style across pages.
