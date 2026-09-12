# County Cricket Live

Unofficial fan site for **men's first-class county cricket** in England and Wales. Championship, T20 Blast, and One-Day Cup. OddHours **Harbour / `theme-petrol`**. Not affiliated with the ECB or any county.

Seeded scores ship with the repo. Live production scrape is **not** cut over.

## One-command local

```bash
pnpm install && pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173). First boot creates `data/county-cricket.sqlite` and seeds it.

| Command         | What it does                                                                |
| --------------- | --------------------------------------------------------------------------- |
| `pnpm dev`      | SvelteKit dev server (seeds DB if empty)                                    |
| `pnpm ingest`   | Separate ingest CLI. Stub only — does not scrape, does not run on page load |
| `pnpm db:reset` | Delete SQLite and re-seed                                                   |
| `pnpm run ci`   | lint + typecheck + tests + build (`pnpm ci` is reserved by pnpm)            |

Node 22+. Native module: `better-sqlite3` (needs a working C toolchain; GitHub Actions Ubuntu is fine).

## Why this stack

- **SvelteKit 2 + TypeScript** — SSR first paint for scores and favourite colour (cookie on `<html>`), mobile-first routing, one language in UI and ingest stubs.
- **better-sqlite3** — ingest writes a local file; page loads never wait on the network. Sync, fast, no extra service for M1.
- **adapter-node** — SQLite wants a long-lived process and a disk. Not a good fit for pure serverless.

Change later only if a host without native addons is clearly better (see `docs/NEXT.md`).

## Config map

Everything structural lives under `src/lib/config/`, parsed with Zod.

| File              | Holds                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `counties.ts`     | 18 counties, abbreviations, Blast names, grounds, **empty YouTube channel IDs**, light+dark palettes                     |
| `competitions.ts` | Championship (10+8), Blast (3×6), One-Day Cup (2×9). **UI reads names from here**                                        |
| `app.ts`          | Season, polling intervals, primary source (`espncricinfo`), blocked BBC/Cricbuzz, takedown placeholder, series URL stubs |
| `overlay.ts`      | Favourite cookie/localStorage keys; CSS variable overlay on OddHours tokens                                              |

Favourite colours overlay `--oh-band` / `--oh-accent` on **`theme-petrol`**. They are not a ninth house theme.

## Design system

Vendored from [OddHours House](https://oddhours-oddhours-io.vercel.app/tokens/) (`oddhours.css` + `tokens.css`) into `src/vendor/oddhours/`. Default: `class="theme-petrol"` on `<html>`. Recipes used: `oh-btn`, `oh-chip` / `oh-chips`, `oh-seg`, `oh-card`, `oh-eyebrow`, `oh-badge`, `oh-tile`, `oh-footer`, `oh-nav__mark` / `oh-nav__logo`, `oh-text-link`. Cricket layout (tab bar, score tables) uses tokens + semantic HTML. Gaps: `docs/ds-gaps.md`.

## Deploy + rough cost

`adapter-node` emits `build/`. Run `node build` with `ORIGIN` and a persistent `DATABASE_PATH`.

| Host                          | Sketch                                                                  | Monthly-ish |
| ----------------------------- | ----------------------------------------------------------------------- | ----------- |
| Fly.io shared VM + 1GB volume | Best match for SQLite                                                   | about $5–12 |
| Railway / a small VPS         | Same idea                                                               | similar     |
| Vercel / Cloudflare Pages     | **Not this stack** — no durable local SQLite without moving to D1/Turso |

Health check: `GET /health`. PWA stub: `static/manifest.webmanifest` + `theme-color`.

## What this run shipped vs later

Shipped: M1 foundations + usable seeded M2/M3 (live list, scorecards, standings, fixtures, team pages, favourite theming, About).

Not this run: live scrape cutover, YouTube live discovery, push notifications, accounts, women's cricket. Detail: `docs/NEXT.md`.
