# Social View Tracker

Track and analyze publicly available engagement metrics (views, likes, comments) for YouTube,
Instagram, TikTok, and X content. Every metric is stamped with its **source** — `OFFICIAL` (a
platform API) or `WEB` (a read of the public post page) — stored as a snapshot history, and
surfaced through dashboards, alerts, webhooks, exports, and a developer API.

> **Honesty by design.** Metrics only ever come from the platform's own public pages, official
> APIs, or — for Instagram — the account owner's own session (Apify-style): you supply the
> `sessionid` cookie of the account you own, and the app reads only that account's posts exactly as
> you see them logged in, labeled **WEB/session**. The app never automates logins, never harvests
> other people's sessions, never bypasses security/anti-bot controls, and never fabricates numbers.
> When a metric cannot be obtained, its status is reported as **Failed** or **Unavailable** with an
> explanation (it shows a "public page" badge when data came from the page, "official API" when it
> came from an API key).

## Features

- **YouTube:** videos, Shorts, Live, embeds, and `youtu.be` links. Uses the Data API v3 when
  `YOUTUBE_API_KEY` is set (`OFFICIAL`); otherwise falls back to reading the public watch page
  (`WEB`).
- **Instagram:** post/reel metrics. Connect Business/Creator accounts in Settings with a long-lived
  token each; post/reel shortcodes are resolved against the linked account's own media and read via
  the Graph API (`OFFICIAL`). Add an optional Facebook Login insights token
  (`instagram_business_manage_insights`) to also receive official reel **view counts (plays)** via
  Media Insights. Without tokens, the public post page's JSON-LD counters are read
  (`WEB`, often login-walled → honestly `Unavailable`).
- **TikTok:** video metrics read from the public video page (`WEB`); full/`t/`/`vm`/`vt` links.
- **X:** post metrics read from the public syndication endpoint (`WEB`); `x.com`/`twitter.com`
  status links.
- **Worker + scheduler:** BullMQ queue (in-process fallback when Redis is absent) with automatic
  re-checks, snapshot history, and exponential retry on rate limits.
- **Dashboard & analytics:** engagement charts (daily/weekly), status breakdown, fastest-growing and
  highest-viewed panels.
- **Alerts:** view-milestone, view-spike, and growth-threshold alerts delivered by email (SMTP) and
  `ALERT_FIRED` webhooks.
- **Webhooks:** signed (`X-SVT-Signature`, HMAC-SHA256) `CONTENT_CHECKED`, `ALERT_FIRED`,
  `CONTENT_FAILED` events.
- **Developer API:** REST endpoints with API-key or session auth; CSV/JSON exports.
- **Auth:** email + password (bcrypt) and optional Google OAuth. Cascade-ready plan/workspace model.

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Recharts 3 ·
PostgreSQL + Prisma 6 · Redis + BullMQ (optional) · jose (JWT sessions) · nodemailer.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start PostgreSQL and Redis (recommended):

   ```bash
   docker compose up -d
   ```

3. Configure environment — copy `.env.example` to `.env` and set at least:

   - `DATABASE_URL` — e.g. `postgresql://svt:svt@localhost:5432/social_view_tracker`
   - `SESSION_SECRET` — a random string ≥ 32 chars (`openssl rand -base64 32`)
   - (optional) `YOUTUBE_API_KEY`, `INSTAGRAM_ACCESS_TOKEN`, `GOOGLE_CLIENT_ID/SECRET`, `SMTP_*`

4. Create the database schema:

   ```bash
   npm run prisma:migrate
   ```

5. Run the app:

   ```bash
   npm run dev            # web app on http://localhost:3000
   ```

   With Redis configured, run the background processes in separate terminals:

   ```bash
   npm run worker
   npm run scheduler
   ```

   Without Redis, metric checks run through an in-process fallback queue automatically and no extra
   processes are needed for local development.

## Scripts

| Script                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Next.js dev server                                 |
| `npm run build`         | `prisma generate` + production build               |
| `npm run start`         | Production server                                  |
| `npm run lint`          | ESLint                                             |
| `npm run typecheck`     | `tsc --noEmit`                                     |
| `npm run worker`        | BullMQ metric worker (`worker/index.ts`)           |
| `npm run scheduler`     | Scheduled recheck sweep (`worker/scheduler.ts`)    |
| `npm run prisma:migrate`| Create/apply dev migrations                        |
| `npm run prisma:deploy` | Apply migrations in production                     |
| `npm run prisma:seed`   | No-op seed (no fabricated data by design)          |
| `npm run test`          | Vitest unit tests (URL parsing, math, fraud flags) |

## API overview

All endpoints return JSON. `GET` endpoints accept a session cookie or
`Authorization: Bearer <api-key>` (keys are created in the app at `/app/api`).

| Method | Path                        | Description                                        |
| ------ | --------------------------- | -------------------------------------------------- |
| POST   | `/api/auth/register`        | Create an account                                 |
| POST   | `/api/auth/login`           | Start a session                                   |
| POST   | `/api/auth/logout`          | End a session                                     |
| GET    | `/api/auth/me`              | Current user + plan                               |
| POST   | `/api/track`                | Track a URL                                       |
| POST   | `/api/track/bulk`           | Track up to 100 URLs                              |
| POST   | `/api/upload/csv`           | Upload a CSV of URLs                              |
| GET    | `/api/content`              | List content (filters/sort/pagination)            |
| GET    | `/api/content/:id`          | One item                                          |
| GET    | `/api/content/:id/history`  | Snapshot history                                  |
| POST   | `/api/content/:id/refresh`  | Re-check now                                      |
| DELETE | `/api/content/:id`          | Remove item                                       |
| GET    | `/api/analytics/summary`    | Aggregates                                        |
| GET    | `/api/analytics/series`     | Time series (`days`, `granularity`)               |
| GET    | `/api/export/csv`           | CSV export                                        |
| GET    | `/api/export/json`          | JSON export                                       |
| GET/POST| `/api/alerts`               | List/create alerts                                |
| PATCH/DELETE | `/api/alerts/:id`      | Update/delete alert                               |
| GET/POST| `/api/webhooks`             | List/create webhooks                              |
| PATCH/DELETE/POST | `/api/webhooks/:id` | Update/delete/test webhook                        |
| GET/POST| `/api/api-keys`             | List/create API keys                              |
| DELETE | `/api/api-keys/:id`         | Revoke an API key                                 |
| GET    | `/api/usage`                | Plan limits + usage                               |

## Deployment

1. Provision a PostgreSQL database and a Redis instance (Redis is optional — without it the app +
   worker use the in-process fallback, but for production you should run the worker with Redis).
2. Set all production environment variables (a strong `SESSION_SECRET`, `DATABASE_URL`,
   `NEXT_PUBLIC_APP_URL`, and the platform credentials you want to use).
3. `npm run prisma:deploy`, then `npm run build`, then `npm run start`.
4. Run `npm run worker` and `npm run scheduler` as long-running processes (e.g. with a process
   manager) if Redis is configured.

## Instagram Reels module (Clip Matrix)

A dedicated Instagram Reel view-tracking system, branded for Clip Matrix. It follows the pipeline:

    Instagram Reel URL → Validate → Extract shortcode → Deduplicate → Create Reel
    → (connected account) resolve media id → authorized metric fetch → store initial views
    → scheduled refresh → fetch latest views → save history → update current views → analytics

### Architecture

    Frontend (/app/reels, /admin/instagram-debug)
       ↓
    API (/api/reels*, /api/instagram/*)
       ↓
    Reel service (src/lib/services/reels.ts)
       ↓
    InstagramMetricsProvider (src/lib/instagram/InstagramMetricsProvider.ts)
       ↓
    Instagram Graph API — OAuth connection (InstagramConnection, encrypted token)
       ↓
    PostgreSQL (instagram_connections · reels · reel_view_history · reel_events · api_request_logs)

The frontend never talks to Instagram directly, and **reel metrics flow only through an authorized
Meta/Instagram OAuth connection** — the public instagram.com page is never fetched or scraped for
view counts. A shortcode is locally decoded into its numeric Graph API media id (Meta's own
base64-style encoding) and then **verified and read through the authorized API with the connected
account's token**. When the authorized API cannot provide a view count, the system records an honest
`metric_unavailable` snapshot — it never fabricates a number.

Statuses: `pending_connection` · `pending_media_resolution` · `active` · `paused` ·
`metric_unavailable` · `failed` · `deleted` · `completed`.

### Connecting an Instagram account (OAuth)

1. Create a Meta app with the Instagram Graph API product
   (`instagram_basic`, `instagram_manage_insights`, `pages_show_list`).
2. Set `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
   (`http://localhost:3000/api/instagram/callback`), and `META_TOKEN_ENCRYPTION_KEY`.
3. In the app: **Settings → Instagram connection (reels) → Connect with Meta**, authorize, and the
   app stores a long-lived token, **encrypted (AES-256-GCM)**. Tokens are never sent to the browser.
4. Add reels under `/app/reels`; first successful official metrics set `initialViews`.

Reels added without a connection are still created (status `pending_connection`) and the API
responds `connection_required`. The admin debug panel `/admin/instagram-debug` runs the live
pipeline step by step (URL → connect → resolve → metrics → views) reporting the exact endpoint,
HTTP status, response time, and any error category.

### Data model

- **`InstagramConnection`** — authorized OAuth connections. Stores the AES-256-GCM-encrypted
  access token, IG user id/username, scopes, expiry, and business/creator flag. `Reel` rows it
  authorizes point to it via `connectedAccountId`.
- **`Reel`** — `instagramReelId` (shortcode, **no query params**), `instagramUrl`, `normalizedUrl`,
  `instagramMediaId` (numeric, resolved through the authorized API), `username`, `caption`,
  `thumbnailUrl`, `currentViews`, `initialViews` (NULL until the first official metric), `viewsGained`,
  `trackingStatus` (see list above), `lastCheckedAt`, retry/backoff columns, and `flaggedForReview`.
- **`ReelViewHistory`** — one row per metric call (`viewCount`, `checkedAt`, `source`,
  `previousViewCount`, plus `eventType`/`flagged`/`note`). `viewCount` is NULL for honest
  `metric_unavailable` snapshots. Powers the historical view graph.
- **`ReelEvent`** — per-reel audit trail (created / refresh / error / flag / status_change).
- **`ApiRequestLog`** — lightweight request log for the reels API (admin diagnostics).

### API routes

| Method | Path                          | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/api/instagram/connect`      | Start Meta OAuth (redirect; auth required) |
| GET    | `/api/instagram/callback`     | OAuth callback → encrypted connection     |
| GET    | `/api/instagram/connections`  | List the user's connections (masked)      |
| DELETE | `/api/instagram/connections/:id` | Disconnect a connection                 |
| POST   | `/api/instagram/test-connection` | Live token/identity check               |
| POST   | `/api/instagram/test-metrics` | Run the full pipeline for a reel URL      |
| POST   | `/api/reels`                  | Add a reel (validates, dedupes)           |
| GET    | `/api/reels`                  | List reels (`search`/`status`/`sort`/`page`) |
| GET    | `/api/reels/stats`            | Dashboard aggregates                     |
| GET    | `/api/reels/:id`              | Single reel + analytics                  |
| GET    | `/api/reels/:id/history`      | View history (`?section=history`)        |
| POST   | `/api/reels/:id/refresh`      | Re-check now                             |
| POST   | `/api/reels/:id/pause`        | Pause tracking                           |
| POST   | `/api/reels/:id/resume`       | Resume tracking                          |
| POST   | `/api/reels/:id/delete`       | Delete reel (admin only)                 |
| GET    | `/api/reels/admin/logs`       | API logs, flagged reels, error events (admin) |

### Integrity (anti-fraud, review-only)

`views_gained = current - initial` and is clamped to 0 when Instagram reports a lower number — that
event is recorded as a **metric correction** (the real value is still stored, flagged for review).
Unusual events are *flagged, never auto-actioned*: corrections, extreme jumps (both relative and
absolute thresholds must pass), repeated identical responses, missing metrics, and reels whose
metadata/views suspiciously match another active reel. All appear under Review in the details page
and `/api/reels/admin/logs`.

### Configuration

See `.env.example` — `IG_REEL_CHECK_INTERVAL_MS` (default 1800000), `REEL_BATCH_SIZE`,
`REEL_MAX_ERRORS_BEFORE_FAIL`, `REEL_JUMP_THRESHOLD_PCT`, `REEL_JUMP_THRESHOLD_ABSOLUTE`,
`REEL_REPEATED_RESPONSE_THRESHOLD`, `REEL_RATE_LIMIT_MAX_REQUESTS`, `REEL_RATE_LIMIT_WINDOW_MS`,
plus the Meta OAuth block (`META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`,
`META_GRAPH_VERSION`, `META_SCOPES`, `META_TOKEN_ENCRYPTION_KEY`). Reels refresh on their own
30-minute cadence driven by `npm run scheduler` (independent of the multi-platform content checks);
the scheduler scans `active` and transient `failed` reels (retried with backoff).

### Extending to other platforms

The same shape (shortcode parser → provider abstraction → history → dashboard) was designed to be
reused for YouTube Shorts, TikTok, and Facebook Reels: implement a metrics provider behind the
existing interface contract and add a sibling model — no rewrite of the service, routes, or UI.

## Security notes

- Passwords are hashed with bcrypt. Sessions are signed JWTs in httpOnly cookies.
- API keys are stored as SHA-256 hashes; the raw key is shown once at creation.
- Webhook payloads are signed with a per-webhook HMAC secret (`X-SVT-Signature: sha256=…`).
- No secrets are committed; everything comes from environment variables.

## Legal / platform notes

- YouTube data uses the official Data API when `YOUTUBE_API_KEY` is set (may incur quota) and
  otherwise reads counts embedded in the public watch page.
- Reel view tracking (the Clip Matrix module) uses **only** the authorized Instagram Graph API via
  a Meta OAuth connection (`instagram_manage_insights` → official `plays`). The public Instagram
  page is never scraped for reel metrics; without a connection, reels honestly report
  `pending_connection`/`connection_required`. The generic Content module's legacy Instagram account
  tokens (Settings → Instagram accounts) remain available for that module but are not used by Reels.
- TikTok and X have no public official metrics API; view/like/comment counts are read from their
  public post pages (source `WEB`). These pages can be geo-, DNS-, or bot-blocked, in which case
  the check honestly reports **Failed/Unavailable**.
- This project is not affiliated with YouTube, Instagram, TikTok, or X.