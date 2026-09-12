# County Cricket Live

Unofficial fan site for **men's first-class county cricket** in England and Wales. Championship, T20 Blast, and One-Day Cup. OddHours **Harbour / `theme-petrol`**. Not affiliated with the ECB or any county.

Page loads read SQLite only. Live scores arrive through `pnpm ingest` (ESPN public cricket JSON / Cricinfo object IDs).

## One-command local

```bash
pnpm install && pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173). First boot creates `data/county-cricket.sqlite` and seeds it.

| Command               | What it does                                                      |
| --------------------- | ----------------------------------------------------------------- |
| `pnpm dev`            | SvelteKit dev server (seeds DB if empty)                          |
| `pnpm ingest`         | Fetch ESPN cricket JSON, upsert SQLite. Never runs on a page load |
| `pnpm ingest --watch` | Repeat on `appConfig.polling` intervals                           |
| `pnpm ingest --full`  | Wider season date walk (more requests)                            |
| `pnpm db:reset`       | Delete SQLite and re-seed                                         |
| `pnpm run ci`         | lint + typecheck + tests + build (`pnpm ci` is reserved by pnpm)  |

Node 22+. Native module: `better-sqlite3` (needs a working C toolchain; GitHub Actions Ubuntu is fine).

## Why this stack

- **SvelteKit 2 + TypeScript** — SSR first paint for scores and favourite colour (cookie on `<html>`), mobile-first routing, one language in UI and ingest.
- **better-sqlite3** — ingest writes a local file; page loads never wait on the network.
- **adapter-node** — SQLite wants a long-lived process and a disk. Not a good fit for pure serverless.

## Config map

Everything structural lives under `src/lib/config/`, parsed with Zod.

| File              | Holds                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `counties.ts`     | 18 counties, abbreviations, Blast names, grounds, **official YouTube channel IDs**, light+dark palettes |
| `competitions.ts` | Championship (10+8), Blast (3×6), One-Day Cup (2×9). **UI reads names from here**                       |
| `app.ts`          | Season, polling, primary source (`espncricinfo`), blocked BBC/Cricbuzz, takedown, ESPN series IDs       |
| `overlay.ts`      | Favourite cookie/localStorage keys; CSS variable overlay on OddHours tokens                             |

Favourite colours overlay `--oh-band` / `--oh-accent` on **`theme-petrol`**. They are not a ninth house theme.

## Design system

Vendored from [OddHours House](https://oddhours-oddhours-io.vercel.app/tokens/) (`oddhours.css` + `tokens.css`) into `src/vendor/oddhours/`. Default: `class="theme-petrol"` on `<html>`. Recipes used: `oh-btn`, `oh-chip` / `oh-chips`, `oh-seg`, `oh-card`, `oh-eyebrow`, `oh-badge`, `oh-tile`, `oh-footer`, `oh-nav__mark` / `oh-nav__logo`, `oh-text-link`. Cricket layout uses tokens + semantic HTML. Gaps: `docs/ds-gaps.md`.

## Deploy

See `docs/deploy.md`. `adapter-node` emits `build/`. Run `node build` with `ORIGIN` and a persistent `DATABASE_PATH`. Pair with `pnpm ingest --watch` (or Docker Compose `ingest` service). Do not scrape from request handlers.

Health check: `GET /health`. PWA stub: `static/manifest.webmanifest` + `theme-color`.

Takedown: [GitHub issues](https://github.com/AlexTrott/oddhours-county-cricket/issues). Optional `TAKEDOWN_EMAIL`.

## What this run shipped vs later

Shipped: foundations, seeded UI, **ingest cutover**, watch sidecar, YouTube IDs, Docker. Not this run: YouTube live discovery, push, accounts, women's cricket. Detail: `docs/NEXT.md` and `docs/sources.md`.
