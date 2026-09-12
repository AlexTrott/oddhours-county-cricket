# Score sources

County Cricket Live is an unofficial fan site. **Page loads never scrape.** They read SQLite only. Ingest is a separate process: `pnpm ingest` or `pnpm ingest --watch`.

## Primary path — ESPN / ESPNCricinfo

Config: `appConfig.sources.primary = 'espncricinfo'`.

`www.espncricinfo.com` HTML and `hs-consumer-api.espncricinfo.com` are often Akamai-blocked from cloud IPs (403). Ingest therefore uses ESPN's public cricket JSON (same object IDs as Cricinfo):

- Scoreboard: `https://site.web.api.espn.com/apis/site/v2/sports/cricket/{leagueId}/scoreboard`
- Summary / scorecard: `.../summary?event={matchId}`
- Standings: `https://site.web.api.espn.com/apis/v2/sports/cricket/{leagueId}/standings`

League IDs (stable) and Cricinfo series IDs live in `appConfig.series`.

| Competition        | ESPN league | Cricinfo series |
| ------------------ | ----------- | --------------- |
| Championship Div 1 | 8052        | 1513323         |
| Championship Div 2 | 8204        | 1513324         |
| T20 Blast          | 8053        | 1512690         |
| One-Day Cup        | 8335        | 1513325         |

At ingest start we fetch `https://espncricinfo.com/robots.txt` and `https://www.espn.com/robots.txt`. If both fail, ingest **skips** and seed is unchanged. BBC and Cricbuzz stay blocked.

User-Agent: `CountyCricketLive/0.1 (+https://github.com/AlexTrott/oddhours-county-cricket)`. Requests are rate-limited (~800ms). A 403/401 on a series leaves that competition's seed/previous rows in place.

## Not fallbacks

### BBC Sport

`robots.txt` on `www.bbc.co.uk` is explicit: no scraping, crawling, or systematic extraction. **Do not add BBC as a scrape fallback.**

### Cricbuzz

`User-agent: *` / `Disallow: /` for generic crawlers. **Do not add Cricbuzz as a fallback.**

## Ingest rules

- Never call providers from `+page.server.ts` / `+layout.server.ts` / `hooks.server.ts`.
- `pnpm ingest` is the write path. `--watch` uses `appConfig.polling`. `--full` walks the season calendar (more requests).
- Seed is `meta.source = seed`. After a successful write, `meta.source = espncricinfo`.
- Unit tests inject a mock `get()`; Vitest cannot call the live network unless `CCL_INGEST_NETWORK=1`.

## Takedown

Published contact: GitHub issues (`appConfig.takedownIssuesUrl`). Optional mailbox: `TAKEDOWN_EMAIL`. The default `takedown@example.com` is a placeholder and is not shown as a live address on About.
