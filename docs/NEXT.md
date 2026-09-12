# Next

Shipped this run: Milestone 1 plus a usable seeded M2/M3 surface.

## Not this run (do not start from a page load)

- **Live production scrape cutover** for ESPNCricinfo (`NotCutOverError` stays until robots + terms + rate limits are handled in `pnpm ingest`).
- **YouTube live discovery** — `youtubeChannelId` is an empty string on every county.
- **Push notifications** — settings shows a closed button.
- **Accounts** — favourite is cookie + localStorage only.
- **Women's cricket** — out of scope; do not silently mix competitions.

## M2/M3 still thin (usable, not finished)

- Live page polls `/api/live` against SQLite. When ingest writes rows, the UI will move. Until then it is seed.
- Standings / fixtures are seed snapshots, not a 2026 live table.
- Settings scheme toggle works; alerts / YouTube do not.
- PWA is a manifest + theme-color stub, not a full service worker cache.

## Possible later stack moves

- Turso/libSQL if the host cannot keep a SQLite file.
- A small worker on the same Node process for ingest cron (still not inside request handlers).
- County YouTube IDs filled from official channels, then a discovery job.

## Product

- Women's regional / county competitions as a separate config tree.
- Ball-by-ball if a licensed feed exists.
- Replace `takedown@example.com` before a public URL.
