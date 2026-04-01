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

Optional (in Vercel but not used by the app code today): `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

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
