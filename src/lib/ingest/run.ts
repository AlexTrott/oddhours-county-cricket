import { londonDateKey } from '../format.js';
import { appConfig, ingestionEnabled } from '../config/index.js';
import type { MatchSummary } from '../match-types.js';
import {
	espnLeagueFor,
	parseCalendarDates,
	parseScoreboard,
	parseStandings,
	parseSummaryScorecard
} from '../providers/espn-parse.js';
import { parseLiveScoresRss } from '../providers/rss.js';
import { IngestDisabledError, type ProviderMatch } from '../providers/types.js';
import { getDb } from '../server/db.js';
import { getMatch, getMeta } from '../server/queries.js';
import { decideCadence, livePollJitterSeconds, matchCoversLondonDate } from './cadence.js';
import {
	ingestFetch,
	loadRobots,
	minIntervalMs,
	RateLimiter,
	scoreboardUrl,
	standingsUrl,
	summaryUrl
} from './http.js';
import { markMatchStale, recordRawPayload, setMeta } from './persist.js';
import { upsertMatches, upsertStandings } from './upsert.js';

export type IngestReport = {
	primary: string;
	blocked: { id: string; reason: string }[];
	result: 'skipped' | 'ok' | 'error';
	message: string;
	network: boolean;
	fetched: number;
	parseFailures: number;
	matchesUpserted: number;
	standingsUpserted: number;
	rssFallback: number;
};

const blocked = () =>
	appConfig.sources.blocked.map((item) => ({
		id: item.id,
		reason: item.reason
	}));

function skipped(message: string, network = false): IngestReport {
	return {
		primary: appConfig.sources.primary,
		blocked: blocked(),
		result: 'skipped',
		message,
		network,
		fetched: 0,
		parseFailures: 0,
		matchesUpserted: 0,
		standingsUpserted: 0,
		rssFallback: 0
	};
}

function liveCount(): number {
	const row = getDb().prepare(`SELECT COUNT(*) AS n FROM matches WHERE status = 'live'`).get() as {
		n: number;
	};
	return row.n;
}

function dbMatchDay(now = new Date()): boolean {
	const today = londonDateKey(now.toISOString());
	const rows = getDb()
		.prepare(`SELECT start_at AS startAt, end_at AS endAt, format FROM matches`)
		.all() as Array<{ startAt: string; endAt: string | null; format: string }>;
	return rows.some((row) => matchCoversLondonDate(row.startAt, row.endAt, row.format, today));
}

function asProviderMatch(match: MatchSummary): ProviderMatch {
	return {
		externalId: match.sourceKey ?? match.id.replace(/^espn-/, ''),
		competitionId: match.competitionId,
		groupId: match.groupId,
		homeTeamId: match.homeTeamId,
		awayTeamId: match.awayTeamId,
		venue: match.venue,
		startAt: match.startAt,
		endAt: match.endAt,
		status: match.status,
		format: match.format,
		round:
			match.round === 'quarter-final' || match.round === 'semi-final' || match.round === 'final'
				? match.round
				: match.round === 'group'
					? 'group'
					: null,
		resultText: match.resultText,
		followOn: match.followOn,
		targetRuns: match.targetRuns,
		targetBalls: match.targetBalls,
		tossWinnerId: match.tossWinnerId,
		tossDecision: match.tossDecision,
		dayNumber: match.dayNumber,
		session: match.session,
		innings: match.innings.map((innings) => ({
			number: innings.number,
			battingTeamId: innings.battingTeamId,
			runs: innings.runs,
			wickets: innings.wickets,
			overs: innings.overs,
			declared: innings.declared
		})),
		scorecard: null
	};
}

export async function runIngest(
	opts: {
		full?: boolean;
		watch?: boolean;
		fetchImpl?: typeof fetch;
		once?: boolean;
	} = {}
): Promise<IngestReport> {
	if (!ingestionEnabled()) {
		return skipped(
			'Live ingest is off (ingestion.enabled=false / INGESTION_ENABLED). Seed SQLite is unchanged. Set INGESTION_ENABLED=true to fetch ESPN JSON.'
		);
	}

	const robots = await loadRobots(appConfig.espn.robotsUrls, opts.fetchImpl);
	const limiter = new RateLimiter(minIntervalMs(robots));
	let fetched = 0;
	let parseFailures = 0;
	let matchesUpserted = 0;
	let standingsUpserted = 0;
	let rssFallback = 0;
	const summarised = new Set<string>();

	async function pull(url: string) {
		const result = await ingestFetch(url, { fetchImpl: opts.fetchImpl, limiter, robots });
		fetched += 1;
		return result;
	}

	async function fetchScorecard(match: ProviderMatch, matchId: string, espnLeagueId: string) {
		if (summarised.has(match.externalId)) return;
		summarised.add(match.externalId);
		const card = await pull(summaryUrl(espnLeagueId, match.externalId));
		if (!card.ok) {
			recordRawPayload({
				source: 'espncricinfo',
				dataType: 'live',
				url: card.url,
				statusCode: card.status,
				payload: card.body,
				parseOk: false,
				error: `scorecard http ${card.status}`
			});
			markMatchStale(matchId, `scorecard http ${card.status}`);
			parseFailures += 1;
			return;
		}
		try {
			const summaryJson = JSON.parse(card.body);
			const withCard = parseSummaryScorecard(summaryJson, match);
			recordRawPayload({
				source: 'espncricinfo',
				dataType: 'live',
				url: card.url,
				statusCode: card.status,
				payload: card.body,
				parseOk: withCard.ok,
				error: withCard.ok ? null : withCard.error
			});
			if (!withCard.ok) {
				markMatchStale(matchId, withCard.error);
				parseFailures += 1;
				return;
			}
			match.scorecard = withCard.value;
			upsertMatches([match]);
			setMeta('live_updated_at', new Date().toISOString());
		} catch (error) {
			markMatchStale(matchId, error instanceof Error ? error.message : 'scorecard parse');
			parseFailures += 1;
		}
	}

	async function tick(full: boolean): Promise<void> {
		const cadence = decideCadence({
			liveCount: liveCount(),
			matchDay: dbMatchDay(),
			lastLiveAt: getMeta('live_updated_at'),
			lastFixturesAt: getMeta('fixtures_updated_at'),
			lastStandingsAt: getMeta('standings_updated_at'),
			full
		});

		for (const league of appConfig.espn.leagues) {
			if (cadence.fetchFixtures || cadence.fetchLive || full) {
				const board = await pull(scoreboardUrl(league.espnId));
				if (!board.ok) {
					recordRawPayload({
						source: 'espncricinfo',
						dataType: 'fixtures',
						url: board.url,
						statusCode: board.status,
						payload: board.body,
						parseOk: false,
						error: `http ${board.status}`
					});
					parseFailures += 1;
					continue;
				}
				let json: unknown;
				try {
					json = JSON.parse(board.body);
				} catch (error) {
					recordRawPayload({
						source: 'espncricinfo',
						dataType: 'fixtures',
						url: board.url,
						statusCode: board.status,
						payload: board.body,
						parseOk: false,
						error: error instanceof Error ? error.message : 'invalid json'
					});
					parseFailures += 1;
					continue;
				}
				const parsed = parseScoreboard(json, league.espnId);
				recordRawPayload({
					source: 'espncricinfo',
					dataType: 'fixtures',
					url: board.url,
					statusCode: board.status,
					payload: board.body,
					parseOk: parsed.ok,
					error: parsed.ok ? null : parsed.error
				});
				if (!parsed.ok) {
					parseFailures += 1;
					continue;
				}
				const ids = upsertMatches(parsed.value);
				matchesUpserted += ids.length;
				setMeta('fixtures_updated_at', new Date().toISOString());
				if (parsed.value.some((match) => match.status === 'live')) {
					setMeta('live_updated_at', new Date().toISOString());
				}

				if (full) {
					const dates = parseCalendarDates(json);
					for (const day of dates) {
						const dated = await pull(scoreboardUrl(league.espnId, day));
						if (!dated.ok) continue;
						try {
							const parsedDay = parseScoreboard(JSON.parse(dated.body), league.espnId);
							recordRawPayload({
								source: 'espncricinfo',
								dataType: 'fixtures',
								url: dated.url,
								statusCode: dated.status,
								payload: dated.body,
								parseOk: parsedDay.ok,
								error: parsedDay.ok ? null : parsedDay.error
							});
							if (parsedDay.ok) {
								matchesUpserted += upsertMatches(parsedDay.value).length;
							} else parseFailures += 1;
						} catch {
							parseFailures += 1;
						}
					}
				}

				const liveOnBoard = parsed.value.filter((item) => item.status === 'live');
				if (cadence.fetchLive || liveOnBoard.length) {
					for (const [index, match] of parsed.value.entries()) {
						if (match.status !== 'live') continue;
						await fetchScorecard(match, ids[index], league.espnId);
					}
				}
			}

			if (cadence.fetchStandings || full) {
				const table = await pull(standingsUrl(league.espnId));
				if (!table.ok) {
					recordRawPayload({
						source: 'espncricinfo',
						dataType: 'standings',
						url: table.url,
						statusCode: table.status,
						payload: table.body,
						parseOk: false,
						error: `http ${table.status}`
					});
					parseFailures += 1;
					continue;
				}
				try {
					const parsed = parseStandings(JSON.parse(table.body), league.espnId);
					recordRawPayload({
						source: 'espncricinfo',
						dataType: 'standings',
						url: table.url,
						statusCode: table.status,
						payload: table.body,
						parseOk: parsed.ok,
						error: parsed.ok ? null : parsed.error
					});
					if (parsed.ok) {
						upsertStandings(parsed.value);
						standingsUpserted += parsed.value.length;
					} else parseFailures += 1;
				} catch (error) {
					parseFailures += 1;
					recordRawPayload({
						source: 'espncricinfo',
						dataType: 'standings',
						url: table.url,
						statusCode: table.status,
						payload: table.body,
						parseOk: false,
						error: error instanceof Error ? error.message : 'standings parse'
					});
				}
			}
		}

		const pullLeftoverLive = cadence.fetchLive || summarised.size > 0 || liveCount() > 0;
		if (pullLeftoverLive) {
			const leftover = getDb()
				.prepare(
					`SELECT id, source_key AS sourceKey, competition_id AS competitionId, group_id AS groupId
					 FROM matches WHERE status = 'live'`
				)
				.all() as Array<{
				id: string;
				sourceKey: string | null;
				competitionId: string;
				groupId: string | null;
			}>;
			for (const row of leftover) {
				if (!row.sourceKey || summarised.has(row.sourceKey)) continue;
				const league = espnLeagueFor(row.competitionId, row.groupId);
				if (!league) continue;
				const stored = getMatch(row.id);
				if (!stored) continue;
				await fetchScorecard(asProviderMatch(stored), row.id, league.espnId);
			}
		}

		if (
			(cadence.fetchLive || summarised.size > 0) &&
			appConfig.sources.byType.live.fallbacks.includes('espncricinfo-rss')
		) {
			const rss = await pull(appConfig.espn.rssUrl);
			if (rss.ok) {
				const items = parseLiveScoresRss(rss.body);
				rssFallback = items.length;
				recordRawPayload({
					source: 'espncricinfo-rss',
					dataType: 'live',
					url: rss.url,
					statusCode: rss.status,
					payload: rss.body,
					parseOk: true,
					error: null
				});
			}
		}
	}

	try {
		await tick(Boolean(opts.full));
		if (parseFailures) {
			console.warn(`County Cricket Live ingest: ${parseFailures} parse/http failures`);
		}
		if (opts.watch && !opts.once) {
			return {
				primary: 'espncricinfo',
				blocked: blocked(),
				result: 'ok',
				message: 'Watch mode should be driven by the CLI loop.',
				network: true,
				fetched,
				parseFailures,
				matchesUpserted,
				standingsUpserted,
				rssFallback
			};
		}
		return {
			primary: 'espncricinfo',
			blocked: blocked(),
			result: parseFailures && !matchesUpserted && !standingsUpserted ? 'error' : 'ok',
			message: `Ingest finished. fetched=${fetched} matches=${matchesUpserted} standings=${standingsUpserted} parseFailures=${parseFailures}.`,
			network: true,
			fetched,
			parseFailures,
			matchesUpserted,
			standingsUpserted,
			rssFallback
		};
	} catch (error) {
		if (error instanceof IngestDisabledError) return skipped(error.message);
		throw error;
	}
}

export async function watchIngest(
	opts: { full?: boolean; fetchImpl?: typeof fetch; abort?: AbortSignal } = {}
) {
	let first = true;
	while (!opts.abort?.aborted) {
		const report = await runIngest({ full: first && opts.full, fetchImpl: opts.fetchImpl });
		first = false;
		const live = liveCount();
		const cadence = decideCadence({
			liveCount: live,
			matchDay: dbMatchDay(),
			lastLiveAt: getMeta('live_updated_at'),
			lastFixturesAt: getMeta('fixtures_updated_at'),
			lastStandingsAt: getMeta('standings_updated_at'),
			full: false
		});
		console.log(report.message);
		const sleepSeconds = live > 0 ? livePollJitterSeconds() : cadence.sleepSeconds;
		await new Promise((resolve) => setTimeout(resolve, sleepSeconds * 1000));
	}
}
