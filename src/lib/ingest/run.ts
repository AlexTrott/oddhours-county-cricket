import { appConfig, ingestSeriesList } from '../config/index.js';
import { applySummaryToMatch, nearbyScoreboardDates, seasonWalkDates, ymdUTC } from './espn-map.js';
import { checkRobots, fetchEspnSnapshot, fetchMatchSummary } from '../providers/espncricinfo.js';
import { providers } from '../providers/index.js';
import type { HttpGet, ProviderMatchDetail, ProviderStandingRow } from '../providers/types.js';
import { politeGet } from '../providers/http.js';
import { ensureDatabase } from '../server/db.js';
import { deleteSeedMatches, replaceStandings, setMeta, upsertMatch } from '../server/upsert.js';

export type IngestScope = 'live' | 'standings' | 'fixtures' | 'all';

export type IngestReport = {
	primary: string;
	blocked: { id: string; reason: string }[];
	result: 'ok' | 'skipped' | 'error';
	message: string;
	network: boolean;
	matches: number;
	standings: number;
	scorecards: number;
	seedRemoved: number;
	skippedSeries: { leagueId: string; reason: string }[];
};

export type RunIngestOptions = {
	get?: HttpGet;
	scope?: IngestScope;
	full?: boolean;
	now?: Date;
	summaryLimit?: number;
};

function datesForScope(scope: IngestScope, full: boolean, now: Date): string[] | undefined {
	if (scope === 'standings') return [];
	if (scope === 'live') return [ymdUTC(now)];
	if (full) return seasonWalkDates(appConfig.season);
	return nearbyScoreboardDates(now);
}

export async function runIngest(options: RunIngestOptions = {}): Promise<IngestReport> {
	const get = options.get ?? politeGet;
	const scope = options.scope ?? 'all';
	const now = options.now ?? new Date();
	const blocked = appConfig.sources.blocked.map((item) => ({
		id: item.id,
		reason: providers[item.id].reason ?? item.reason
	}));

	const robots = await checkRobots(get);
	if (!robots.ok) {
		return {
			primary: 'espncricinfo',
			blocked,
			result: 'skipped',
			message: robots.reason ?? 'robots check failed',
			network: true,
			matches: 0,
			standings: 0,
			scorecards: 0,
			seedRemoved: 0,
			skippedSeries: []
		};
	}

	ensureDatabase();
	const dates = datesForScope(scope, options.full === true, now);
	const includeStandings = scope === 'standings' || scope === 'all';
	const includeCurrent = scope !== 'standings';
	const skippedSeries: { leagueId: string; reason: string }[] = [];
	const matches: ProviderMatchDetail[] = [];
	const standingsByCompetition = new Map<string, ProviderStandingRow[]>();

	for (const series of ingestSeriesList()) {
		const result = await fetchEspnSnapshot(
			{
				series,
				dates: dates && dates.length ? dates : undefined,
				includeCurrent,
				includeStandings,
				summaryMatchIds: []
			},
			{ get }
		);
		if (!result.ok) {
			skippedSeries.push({ leagueId: series.espnLeagueId, reason: result.reason });
			continue;
		}
		matches.push(...result.snapshot.matches);
		if (result.snapshot.standings.length) {
			const existing = standingsByCompetition.get(series.competitionId) ?? [];
			standingsByCompetition.set(series.competitionId, [...existing, ...result.snapshot.standings]);
		}
	}

	const summaryLimit = options.summaryLimit ?? 12;
	if (scope !== 'standings') {
		const liveIds = matches
			.filter((match) => match.status === 'live')
			.map((match) => match.externalId);
		const completedIds = matches
			.filter((match) => match.status === 'completed' && !match.hasScorecard)
			.map((match) => match.externalId);
		const summaryIds = [...new Set([...liveIds, ...completedIds])].slice(0, summaryLimit);
		for (const matchId of summaryIds) {
			const match = matches.find((row) => row.externalId === matchId);
			if (!match) continue;
			const series = ingestSeriesList().find(
				(item) =>
					item.competitionId === match.competitionId &&
					(item.groupId === null || item.groupId === match.groupId)
			);
			if (!series) continue;
			const summary = await fetchMatchSummary(series, matchId, { get });
			if (!summary) continue;
			const index = matches.findIndex((row) => row.externalId === matchId);
			if (index >= 0) matches[index] = applySummaryToMatch(match, summary);
		}
	}

	const updatedAt = now.toISOString();
	let seedRemoved = 0;
	for (const match of matches) upsertMatch(match, appConfig.season, updatedAt);

	const allStandings = [...standingsByCompetition.values()].flat();
	const uniqueStandings = new Map<string, ProviderStandingRow>();
	for (const row of allStandings)
		uniqueStandings.set(`${row.competitionId}:${row.groupId}:${row.teamId}`, row);
	replaceStandings([...uniqueStandings.values()], appConfig.season, updatedAt);

	for (const series of ingestSeriesList()) {
		const seriesMatches = matches.filter((match) => {
			if (match.competitionId !== series.competitionId) return false;
			return series.groupId ? match.groupId === series.groupId : true;
		});
		const seriesStandings = allStandings.filter((row) => {
			if (row.competitionId !== series.competitionId) return false;
			return series.groupId ? row.groupId === series.groupId : true;
		});
		if (!seriesMatches.length && !seriesStandings.length) continue;
		seedRemoved += deleteSeedMatches(series.competitionId, appConfig.season, series.groupId);
	}

	if (matches.length || standingsByCompetition.size) {
		setMeta('source', 'espncricinfo');
		setMeta('updated_at', updatedAt);
		setMeta('ingest_scope', scope);
	}

	const scorecards = matches.filter((match) => match.hasScorecard).length;
	const allSkipped = skippedSeries.length === ingestSeriesList().length;
	if (allSkipped && !matches.length) {
		return {
			primary: 'espncricinfo',
			blocked,
			result: 'skipped',
			message:
				skippedSeries[0]?.reason ?? 'ESPN cricket feed unreachable. Seeded SQLite is unchanged.',
			network: true,
			matches: 0,
			standings: 0,
			scorecards: 0,
			seedRemoved: 0,
			skippedSeries
		};
	}

	const standingCount = [...standingsByCompetition.values()].reduce(
		(total, rows) => total + rows.length,
		0
	);

	return {
		primary: 'espncricinfo',
		blocked,
		result: 'ok',
		message: `Ingested ${matches.length} matches (${scorecards} scorecards) and ${standingCount} standings rows from ESPN/Cricinfo.`,
		network: true,
		matches: matches.length,
		standings: standingCount,
		scorecards,
		seedRemoved,
		skippedSeries
	};
}
