# finance.hub — project context for LLMs

Use this document to understand what this repository is for, what it ships today, and how it is built. It is meant to be uploaded or pasted into an AI assistant as grounding context.

## What this project aims to do

**finance.hub** is a **personal finance web app** (tagline on the site: “Your personal finance command center”). It aggregates **read-only tools and calculators** for planning and learning: stocks, lifestyle affordability, FX, central-bank rates, savings and credit-card comparisons, capital-flows views, prediction-market odds, and generic financial calculators.

The product stance is **educational / informational**: the UI states that the site offers “tools for planning and learning” and is **not financial advice**.

## Main user-facing areas

These map to routes under `src/app/` and are summarized on the home page (`src/app/page.tsx`):

| Area | Route (typical) | Intent |
|------|-----------------|--------|
| Stocks | `/stocks` | **Stock report cards** with multiple graded metrics; backed by market data (see APIs). |
| Lifestyle | `/lifestyle` | **Affordability / lifestyle calculator** across many US cities. |
| FX | `/fx` | **Live FX** and converter (e.g. USD/JPY, USD/KRW, KRW/JPY). |
| Interest rates | `/rates` | **Policy rates** (e.g. Fed, BOJ, BOK) with history. |
| Savings | `/savings` | **High-yield savings** listings ranked by APY. |
| Credit cards | `/credit-cards` | **Card comparison** (e.g. bonuses). |
| Capital flows | `/flows` | **Flow / positioning** style views (e.g. gold, oil, crypto). |
| Probabilities | `/polymarket` | **Polymarket** top markets by volume with implied odds. |
| Calculators | `/calculators` | **Compound interest, mortgage, FIRE, debt payoff**, etc. |

## Technical stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for styling
- **Supabase** for authentication and **per-user persisted data** (see database section)
- **Vercel Analytics** (`@vercel/analytics`)
- **Recharts** for charts where used

Application code lives primarily under **`src/`** (e.g. `src/app`, `src/components`, `src/lib`).

## Backend shape (high level)

- **Route Handlers** under `src/app/api/**/route.ts` implement JSON APIs used by the UI (e.g. `api/report`, `api/fx`, `api/rates`, `api/flows`, `api/savings`, `api/credit-cards`, `api/lifestyle`, `api/polymarket-top`, and authenticated `api/me/*` routes).
- **Stock report** aggregation is implemented around Finnhub: `src/app/api/report/route.ts` requires `FINNHUB_API_KEY` and builds reports via `buildStockReport` / symbol resolution helpers in `src/lib/`.
- **Auth callback**: `src/app/auth/callback/route.ts` (Supabase OAuth flow).

## Environment variables (from `.env.example`)

- **`FINNHUB_API_KEY`** — required for stock report functionality (server-side).
- **`NEXT_PUBLIC_SUPABASE_URL`** / **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — Supabase client; used for sign-in and saved user data.

Secrets belong in `.env.local` (gitignored); never commit real keys.

## Database (Supabase) — user-owned data

Migrations live under `supabase/migrations/`. The migration `20260407120000_user_data.sql` defines **Row Level Security (RLS)**-backed tables for logged-in users, including (non-exhaustive):

- **Watchlists** and **watchlist symbols**
- **Lifestyle scenarios** and a **lifestyle draft**
- **FX preferences**
- **Saved savings accounts** and **saved credit cards** (by stable IDs)
- **Calculator snapshots**

Treat these as **private user state** scoped by `user_id` referencing `auth.users`.

## Supporting scripts

`package.json` includes generators such as:

- Lifestyle city / cost-of-living data generation
- S&P 500 and KOSPI lookup generation

These support static or semi-static datasets used by the app.

## How to talk about this repo in one sentence

> **finance.hub** is a Next.js personal-finance hub that combines market and macro data APIs with calculators and comparisons, optional Supabase sign-in for saving preferences and lists, and clear non-advice disclaimers.

---

*This file is maintained as a compact LLM briefing. For day-to-day developer docs, see `README.md`.*
