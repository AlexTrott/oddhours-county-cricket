# Next

Shipped this run: ingest cutover for ESPN/Cricinfo JSON (off the request path), watch sidecar, official YouTube channel IDs, GitHub-issues takedown, Docker Compose.

## Still later

- **YouTube live discovery** — channel IDs are filled; this app does not find live video IDs.
- **Push notifications** — settings shows a closed button.
- **Accounts** — favourite is cookie + localStorage only.
- **Women's cricket** — out of scope; do not silently mix competitions.
- Championship batting/bowling bonus columns are not in the ESPN standings payload (points total is).

## Ops

- If ESPN returns 403 from a host, ingest skips that series and keeps SQLite as-is. See `docs/sources.md`.
- Production: `node build` plus `pnpm ingest --watch` on the same `DATABASE_PATH`. `docs/deploy.md`.
- Replace `TAKEDOWN_EMAIL` before a public URL.

## Possible later stack moves

- Turso/libSQL if the host cannot keep a SQLite file.
- Licensed ball-by-ball if one exists.
- Women's regional / county competitions as a separate config tree.
