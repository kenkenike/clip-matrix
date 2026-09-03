# Clip Matrix

Turn content into distribution. Clip Matrix is a two-sided marketplace where brands launch performance-based clipping campaigns and creators earn on every verified view across TikTok, Instagram Reels, YouTube Shorts, and X.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Windows note:** if `node`/`npm` are not on your PATH, prepend the Node install dir first:
>
> ```powershell
> $env:Path = "C:\Program Files\nodejs;$env:Path"; npm.cmd run dev
> ```

## Stack

- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS v4 (CSS-first `@theme` tokens in `src/app/globals.css`)
- Recharts for dashboard charts, lucide-react icons
- Prisma schema documenting the production data model (`prisma/schema.prisma`, not yet wired to a database)

## Architecture: mock service layer

**No page hardcodes business data.** Every screen renders through typed service interfaces defined in `src/lib/services/types.ts`:

- `campaignService` - campaign discovery, detail, creation, submission
- `creatorService` - creator profiles, directory, earnings overview
- `brandService` - brand dashboard aggregates, leaderboards, breakdowns
- `analyticsService` - time series and network stats
- `paymentService` - balances, payout methods, transactions
- `socialPlatformService` - connected accounts and post metric detection
- `adminService` - admin overview, users, fraud queue, moderation

Mock implementations live in `src/lib/services/mock/*.mock.ts`, seeded from `src/lib/mock-data/*.seed.ts`, and simulate async latency so loading skeletons behave like production.

### Swapping in real backends

1. Implement the same interfaces from `src/lib/services/types.ts` against your API/database.
2. Re-point the exports in `src/lib/services/index.ts` to the new implementations.
3. No page or component changes are required - they only consume the service contracts.

The Prisma schema in `prisma/schema.prisma` documents the intended persistence model (users, profiles, campaigns, rules, clips, metrics, submissions, earnings, payouts, transactions, moderation, fraud, teams, subscriptions). To go live: set `DATABASE_URL`, run `prisma migrate dev`, then write Prisma-backed implementations of the services.

## Project layout

```
src/
  app/
    (marketing)/     # public site: home, creators, brands, campaigns, pricing, ...
    (auth)/          # login, signup, forgot-password (UI-only flows)
    dashboard/       # creator workspace
    brand/           # brand workspace
    admin/           # admin panel
  components/
    ui/              # design-system primitives
    marketing|home|dashboard|brand|admin/   # feature components
  lib/
    services/        # typed service layer (interfaces + mocks)
    mock-data/       # seed data modules
    brand.ts         # brand constants
    format.ts        # currency/view/date formatters (minor units everywhere)
```

All money values are integer minor units (cents) end-to-end; convert only at render time via `src/lib/format.ts`.
