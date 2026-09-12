# Score sources

County Cricket Live is an unofficial fan site. **Page loads never scrape.** They read SQLite only. Network ingest is a separate process (`pnpm ingest`), gated by `ingestion.enabled` / `INGESTION_ENABLED`.

## Primary path — ESPN public JSON (Cricinfo data)

Config: `appConfig.sources.primary = 'espncricinfo'`.

Working unofficial JSON, documented from ESPN’s own network calls (not HTML scrape):

| Data                  | URL                                                                                                          | Notes                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Scoreboard / fixtures | `https://site.web.api.espn.com/apis/site/v2/sports/cricket/{leagueId}/scoreboard` optional `?dates=YYYYMMDD` | `calendar` lists match days. Date ranges 404.              |
| Scorecard             | `https://site.web.api.espn.com/apis/site/v2/sports/cricket/{leagueId}/summary?event={eventId}`               | Rosters carry batting/bowling; matchcards have extras/FOW. |
| Standings             | `https://site.web.api.espn.com/apis/v2/sports/cricket/{leagueId}/standings`                                  | P/W/L/D/NR/Pts/NRR. No separate batting/bowling bonus.     |

League IDs (2026): Championship Div 1 `8052` (series `1513323`), Div 2 `8204` (`1513324`), Blast `8053` (`1512690`), One-Day Cup `8335` (`1513325`).

User-Agent: `CountyCricketLive/0.1 (+https://github.com/AlexTrott/oddhours-county-cricket; contact takedown@example.com)`.

### robots.txt (this environment)

| Host                                                     | Result                                                                                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `https://espncricinfo.com/robots.txt`                    | 200. `User-agent: *` / `Allow: /*` with disallows for print wrappers, cgi-bin, video, internal tools. JSON APIs are not disallowed. |
| `https://www.espncricinfo.com/robots.txt`                | Often **403** from Akamai. Do not assume allow from www.                                                                            |
| `https://www.espn.com/robots.txt`                        | 200. Disallows some HTML paths (`*/playbyplay?`, `*/admin/`, …). `/apis/` is not disallowed.                                        |
| `https://site.web.api.espn.com/robots.txt`               | 403 (no robots file). Follow parent ESPN rules.                                                                                     |
| `https://hs-consumer-api.espncricinfo.com/`              | 403 from this environment. Not used.                                                                                                |
| `https://www.espncricinfo.com/ci/engine/match/{id}.json` | 403 from this environment. Not used.                                                                                                |

Ingest fetches robots at run time and skips blocked paths. Robots rules are applied **only to that host and its subdomains** (so ESPN.com disallows do not apply to `static.espncricinfo.com` RSS). Self-throttle: 1 request/second (or robots crawl-delay if larger).

## Fallback per data type

| Type            | Primary                                                | Fallback                                                                                                                                                  |
| --------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live scorecards | ESPN summary JSON                                      | **RSS** `https://static.espncricinfo.com/rss/livescores.xml` for _discovery of men’s county titles only_. No batting cards. Women’s cricket filtered out. |
| Fixtures        | ESPN scoreboard + calendar walk (`pnpm ingest --full`) | None. RSS has no diary.                                                                                                                                   |
| Standings       | ESPN standings JSON                                    | None.                                                                                                                                                     |

### Why single-source for full cards

BBC Sport and Cricbuzz remain **blocked** (robots / ToS). There is no second legal, key-free provider that offers county scorecards. cricketdata.org would need an API key and is not locked in config. Fuzzy matching (`competition + sorted teams + London date`, ±3 days for first-class) is implemented so a second provider can be attached later without rewriting IDs.

## Persist + stale

Raw payloads land in `ingest_raw`. Parser failures go to `ingest_failures` and set `matches.stale = 1`. Last good innings/standings are not overwritten.

## Cadence (configurable in `appConfig.polling`)

- Live scorecards: 30–45s **per live match only** (no live matches → no summary polling).
- Fixtures: 5 minutes on match days (calendar hit), hourly otherwise. `--full` walks the season calendar.
- Standings: 15 minutes if any match is live, else 6 hours.

## Latency (open question §12)

Observed from this environment (2026-09-12):

- Scoreboard JSON: typically < 300ms, `cache-control: max-age=1`.
- Standings JSON: ~200–400ms.
- Summary JSON: large (300–400KB uncompressed); budget 1 rps so N live matches add ~N seconds per tick.
- UI polls SQLite every 30s; delayed banner at **>3 min**; `/health` `ok: false` when ingest is on, something is live, and last good update is **>15 min**. `/health` logs a warning at delayed and unavailable.

Seed `updated_at` is **not** treated as delayed. Freshness delayed/unavailable only applies when ingest is enabled.

## Ingest rules

- Never call providers from `+page.server.ts` / `+layout.server.ts` / `hooks.server.ts`.
- `INGESTION_ENABLED=true pnpm ingest` (optional `--full`, `--watch`) is the only network entry.
- Seed remains the offline default (`meta.source = seed`).

## Takedown

Placeholder: `appConfig.takedownEmail` (`takedown@example.com`). Replace before any public deploy.
