# County Cricket Live

Unofficial fan site for **men's first-class county cricket** in England and Wales. Championship, T20 Blast, and One-Day Cup. OddHours **Harbour / `theme-petrol`**. Not affiliated with the ECB or any county.

Seeded scores and a captured **2026 fixture list** ship with the repo. Live ESPN JSON ingest is **off by default**.

## One-command local

```bash
pnpm install && pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173). First boot creates `data/county-cricket.sqlite` and seeds it.

| Command               | What it does                                                                      |
| --------------------- | --------------------------------------------------------------------------------- |
| `pnpm dev`            | SvelteKit dev server (seeds DB if empty)                                          |
| `pnpm ingest`         | Separate ingest CLI. **No-op unless ingest is enabled.** Never runs on page load  |
| `pnpm ingest --full`  | Enabled ingest: walk ESPN calendars as well as today’s boards                     |
| `pnpm ingest --watch` | Loop on PRD cadence (live 30–45s, fixtures 5 min / hourly, standings 15 min / 6h) |
| `pnpm db:reset`       | Delete SQLite and re-seed                                                         |
| `pnpm run ci`         | lint + typecheck + tests + build (`pnpm ci` is reserved by pnpm)                  |

### Enable live ingest

```bash
INGESTION_ENABLED=true pnpm ingest --full
INGESTION_ENABLED=true pnpm ingest --watch
```

Optional: `INGEST_CONTACT_EMAIL` (still `takedown@example.com` until a real contact is locked). User-Agent is descriptive: `CountyCricketLive/0.1 (+https://github.com/AlexTrott/oddhours-county-cricket; contact …)`.

Pages still only read SQLite. Detail: `docs/sources.md`.

Node 22+. Native module: `better-sqlite3` (needs a working C toolchain; GitHub Actions Ubuntu is fine).

## Why this stack

- **SvelteKit 2 + TypeScript** — SSR first paint for scores and favourite colour (cookie on `<html>`), mobile-first routing, one language in UI and ingest.
- **better-sqlite3** — ingest writes a local file; page loads never wait on the network.
- **adapter-node** — SQLite wants a long-lived process and a disk. Not a good fit for pure serverless.

Change later only if a host without native addons is clearly better (see `docs/NEXT.md`).

## Config map

Everything structural lives under `src/lib/config/`, parsed with Zod.

| File              | Holds                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `counties.ts`     | 18 counties, abbreviations, Blast names, grounds, **empty YouTube channel IDs**, light+dark palettes                             |
| `competitions.ts` | Championship (10+8), Blast (3×6), One-Day Cup (2×9). **UI reads names from here**                                                |
| `app.ts`          | Season, ingest gate, polling cadence, ESPN league IDs, primary/fallback by data type, blocked BBC/Cricbuzz, takedown placeholder |
| `overlay.ts`      | Favourite + competition cookie/localStorage keys; CSS variable overlay on OddHours tokens                                        |

Favourite colours overlay `--oh-band` / `--oh-accent` on **`theme-petrol`**. They are not a ninth house theme.

## Design system

Vendored from [OddHours House](https://oddhours-oddhours-io.vercel.app/tokens/) (`oddhours.css` + `tokens.css`) into `src/vendor/oddhours/`. Default: `class="theme-petrol"` on `<html>`. Recipes used: `oh-btn`, `oh-chip` / `oh-chips`, `oh-seg`, `oh-card`, `oh-eyebrow`, `oh-badge`, `oh-tile`, `oh-footer`, `oh-nav__mark` / `oh-nav__logo`, `oh-text-link`. Cricket layout (tab bar, score tables) uses tokens + semantic HTML. Gaps: `docs/ds-gaps.md`.

## Deploy + rough cost

`adapter-node` emits `build/`. Run `node build` with `ORIGIN` and a persistent `DATABASE_PATH`. Enable ingest with `INGESTION_ENABLED=true` and a sidecar/cron for `pnpm ingest --watch`.

| Host                          | Sketch                                                                  | Monthly-ish |
| ----------------------------- | ----------------------------------------------------------------------- | ----------- |
| Fly.io shared VM + 1GB volume | Best match for SQLite                                                   | about $5–12 |
| Railway / a small VPS         | Same idea                                                               | similar     |
| Vercel / Cloudflare Pages     | **Not this stack** — no durable local SQLite without moving to D1/Turso |

Health check: `GET /health` (source freshness, delayed/unavailable when ingest is on). PWA stub: `static/manifest.webmanifest` + `theme-color`.

## What this run shipped vs later

Shipped: ESPN JSON ingest (env-gated), parser tests on captured samples, full-season fixtures UI (filters, knockouts, scroll to today), competition cookie, real `/health` freshness. Seed path still works with ingest off.

Not this run: YouTube live discovery, push notifications, accounts, women's cricket. Detail: `docs/NEXT.md`.
