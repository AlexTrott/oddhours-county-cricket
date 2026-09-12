# Deploy

`adapter-node` emits `build/`. The web process only reads SQLite. Ingest is a **separate** process.

```bash
pnpm build
ORIGIN=https://example.com DATABASE_PATH=/data/county-cricket.sqlite node build
```

Health: `GET /health`.

## Sidecar ingest

```bash
DATABASE_PATH=/data/county-cricket.sqlite pnpm ingest --watch
```

Or `INGEST_WATCH=1 pnpm start:with-ingest`. Do not start ingest from `hooks.server.ts`.

## Docker

```bash
docker compose up --build
```

`web` serves the app. `ingest` runs `pnpm ingest --watch` against the same volume.

## Fly.io sketch

```toml
# fly.toml (example — create the app yourself)
app = "county-cricket-live"
primary_region = "lhr"

[env]
  ORIGIN = "https://county-cricket-live.fly.dev"
  DATABASE_PATH = "/data/county-cricket.sqlite"

[http_service]
  internal_port = 3000
  force_https = true

[mounts]
  source = "ccl_data"
  destination = "/data"
```

Run ingest as a second process on the same volume, or a Fly machine with `--watch`. About $5–12/month for a shared VM + 1GB volume.

Set `TAKEDOWN_EMAIL` before a public URL. GitHub issues is the published contact:

https://github.com/AlexTrott/oddhours-county-cricket/issues
