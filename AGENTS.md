# AGENTS.md

## Cursor Cloud specific instructions

Single Next.js 14 app (Pages Router, JavaScript) — the personal/pro site for Corentin Robert (blog Notion, marketplace, cas d'usage pSEO, objectifs). There is no monorepo, no database container, no `docker-compose`, and no separate backend. Everything is this one app plus external SaaS APIs.

### Run / build (only one service)

- Package manager is **npm** (`package-lock.json`). Dependencies are installed by the startup update script; no manual install needed at session start.
- Dev server: `npm run dev` → http://localhost:3000 (default port). Build: `npm run build`. Prod start: `npm start`. These are the standard scripts in `package.json`.
- Node 22 works fine (no version is pinned in the repo).

### Lint / tests (gotchas)

- `npm run lint` is **not configured**: no ESLint config is committed, so `next lint` drops into an **interactive setup prompt** and will hang a non-interactive shell. Do not run it in automation unless you first add an ESLint config (which changes the repo).
- There is **no test suite** (no `test` script, no test runner configured).

### Env vars & what works without secrets

- The app **boots and serves pages with zero env vars**. Env vars are documented in `README.md` (plus more listed in code). Most features degrade gracefully when a secret is missing.
- Works locally with no secrets: all static/marketing pages, `cas-usage` case studies (`lib/case-studies.js`), and the marketplace **"Scrapers"** tab (served from committed `data/apify-actors.json`, ~12 actors). The contact form API (`/api/contact`) is **simulated** — it always returns success and needs no secret.
- Needs **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`): marketplace **"Bases de données"** tab (shows "0 bases" locally since `data/marketplace-databases.json` is git-ignored and not committed), blog/marketplace **view counters**, **reviews**, and tool-email capture (`/api/tools/collect-email`, used by `/outils/email-generator`). These write endpoints **return HTTP 500 locally without the Blob token** — this is expected, not a bug.
- Needs **Notion** (`NOTION_TOKEN` + `NOTION_DATABASE_ID`): live blog content (falls back to Blob cache, else empty list).
- Optional integrations (Stripe, Gumroad, Apify token, OpenAI, Google APIs, Spotify, Resend, Telegram, Tella, Sentry, GA) only affect their specific flows/scripts.
- Cron routes under `pages/api/cron/*` require header `Authorization: Bearer $CRON_SECRET`; on Vercel they run on the schedule in `vercel.json`.

### Other notes

- Sentry is wired in `next.config.js`; source-map upload is disabled unless `SENTRY_AUTH_TOKEN` is set, so builds run fine without Sentry credentials.
- `scripts/*` are one-off operational sync utilities (Notion/Stripe/Gumroad/Apify/Sheets), not part of running the app; most require the corresponding external credentials.
