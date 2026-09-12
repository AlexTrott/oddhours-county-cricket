# Score sources

County Cricket Live is an unofficial fan site. This boot **does not scrape**. Page loads read SQLite only. Ingest is a separate process (`pnpm ingest`) and currently exits after explaining that production scrape is not cut over.

## Primary path — ESPNCricinfo

Config: `appConfig.sources.primary = 'espncricinfo'`.

Provider: `src/lib/providers/espncricinfo.ts`. `enabled: true`, but `fetchLiveMatches()` throws `NotCutOverError`. That is intentional. A later milestone should:

1. Fetch `robots.txt` at ingest time (this environment received an edge denial fetching it; do not assume allow).
2. Honour crawl-delay and disallows.
3. Prefer documented or licensed feeds if they exist; otherwise a polite, rate-limited HTML/JSON ingest with caching, off the request path.
4. Keep county series URLs in `appConfig.series` rather than hard-coding them in UI.

Do **not** treat Cricinfo as a free API. Check their terms before cutover.

## Not fallbacks

### BBC Sport

`robots.txt` on `www.bbc.co.uk` is explicit: no scraping, crawling, or systematic extraction; no summaries for your own use; no business use without permission. `appConfig.sources.blocked` includes `bbc`. `bbcProvider.enabled === false`. **Do not add BBC as a scrape fallback.**

### Cricbuzz

`User-agent: *` / `Disallow: /` for generic crawlers. Live score paths are also disallowed for Googlebot. `cricbuzzProvider.enabled === false`. **Do not add Cricbuzz as a fallback.**

## Ingest rules

- Never call providers from `+page.server.ts` / `+layout.server.ts` / `hooks.server.ts`.
- `pnpm ingest` is the only entry. Today it reports blocked sources and skips.
- Seed data is labelled `meta.source = seed` with `updated_at` set at seed time.

## Takedown

Placeholder: `appConfig.takedownEmail` (`takedown@example.com`). Replace before any public deploy.
