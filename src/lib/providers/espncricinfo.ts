import { competitionById } from '../config/index.js';
import type { SeriesEntry } from '../config/schema.js';
import {
	CRICINFO_ROBOTS_URL,
	ESPN_ROBOTS_URL,
	ESPN_SITE_API,
	INGEST_USER_AGENT,
	politeGet
} from './http.js';
import { evaluateIngestRobots } from './robots.js';
import {
	IngestNetworkGuardError,
	type FetchLiveResult,
	type HttpGet,
	type ProviderResult,
	type ScoreProvider,
	type SnapshotRequest
} from './types.js';
import {
	applySummaryToMatch,
	parseScoreboardEvents,
	parseStandingsPayload
} from '../ingest/espn-map.js';

export type EspnClient = {
	get: HttpGet;
};

async function readJson(get: HttpGet, url: string): Promise<{ status: number; json: unknown }> {
	const response = await get(url);
	if (response.status < 200 || response.status >= 300) {
		return { status: response.status, json: null };
	}
	try {
		return { status: response.status, json: JSON.parse(response.body) as unknown };
	} catch {
		return { status: response.status, json: null };
	}
}

export async function checkRobots(get: HttpGet) {
	let espnRobots: string | null = null;
	let cricinfoRobots: string | null = null;
	try {
		const espn = await get(ESPN_ROBOTS_URL);
		if (espn.status === 200) espnRobots = espn.body;
	} catch (error) {
		if (error instanceof IngestNetworkGuardError) throw error;
		espnRobots = null;
	}
	try {
		const cricinfo = await get(CRICINFO_ROBOTS_URL);
		if (cricinfo.status === 200) cricinfoRobots = cricinfo.body;
	} catch (error) {
		if (error instanceof IngestNetworkGuardError) throw error;
		cricinfoRobots = null;
	}
	return evaluateIngestRobots({
		espnRobots,
		cricinfoRobots,
		userAgent: INGEST_USER_AGENT
	});
}

export async function fetchMatchSummary(
	series: SeriesEntry,
	matchId: string,
	client: EspnClient
): Promise<unknown | null> {
	const url = `${ESPN_SITE_API}/apis/site/v2/sports/cricket/${series.espnLeagueId}/summary?event=${matchId}`;
	const { status, json } = await readJson(client.get, url);
	if (status !== 200) return null;
	return json;
}

export async function fetchEspnSnapshot(
	request: SnapshotRequest,
	client: EspnClient
): Promise<ProviderResult> {
	const format = competitionById[request.series.competitionId]?.format ?? 'first-class';
	const leagueId = request.series.espnLeagueId;
	const scoreboardBase = `${ESPN_SITE_API}/apis/site/v2/sports/cricket/${leagueId}/scoreboard`;
	const matchesById = new Map<string, ReturnType<typeof parseScoreboardEvents>[number]>();

	const urls: string[] = [];
	if (request.includeCurrent !== false) urls.push(scoreboardBase);
	for (const date of request.dates ?? []) {
		urls.push(`${scoreboardBase}?dates=${date}`);
	}

	for (const url of urls) {
		const { status, json } = await readJson(client.get, url);
		if (status === 403 || status === 401) {
			if (url === scoreboardBase || matchesById.size === 0) {
				return {
					ok: false,
					skipped: true,
					reason: `ESPN cricket scoreboard returned ${status} for league ${leagueId}. Seed kept.`
				};
			}
			continue;
		}
		if (status !== 200 || json === null) continue;
		for (const match of parseScoreboardEvents(json, request.series, format)) {
			matchesById.set(match.externalId, match);
		}
	}

	let standings = [] as ReturnType<typeof parseStandingsPayload>;
	if (request.includeStandings) {
		const standingsUrl = `${ESPN_SITE_API}/apis/v2/sports/cricket/${leagueId}/standings`;
		const { status, json } = await readJson(client.get, standingsUrl);
		if (status === 200 && json) standings = parseStandingsPayload(json, request.series);
	}

	const summaryIds = request.summaryMatchIds ?? [];
	for (const matchId of summaryIds) {
		if (!matchesById.has(matchId)) continue;
		const summaryUrl = `${ESPN_SITE_API}/apis/site/v2/sports/cricket/${leagueId}/summary?event=${matchId}`;
		const { status, json } = await readJson(client.get, summaryUrl);
		if (status !== 200 || json === null) continue;
		const current = matchesById.get(matchId);
		if (current) matchesById.set(matchId, applySummaryToMatch(current, json));
	}

	return {
		ok: true,
		snapshot: {
			series: request.series,
			matches: [...matchesById.values()],
			standings
		}
	};
}

export function createEspncricinfoProvider(client: EspnClient = { get: politeGet }): ScoreProvider {
	return {
		id: 'espncricinfo',
		label: 'ESPNCricinfo',
		enabled: true,
		async fetchLiveMatches(): Promise<FetchLiveResult> {
			const robots = await checkRobots(client.get);
			if (!robots.ok) {
				return { ok: false, skipped: true, reason: robots.reason ?? 'robots check failed' };
			}
			const { ingestSeriesList } = await import('../config/index.js');
			const matches = [];
			for (const series of ingestSeriesList()) {
				const result = await fetchEspnSnapshot(
					{ series, includeCurrent: true, includeStandings: false },
					client
				);
				if (result.ok)
					matches.push(...result.snapshot.matches.filter((match) => match.status === 'live'));
			}
			return { ok: true, matches };
		},
		async fetchSnapshot(request: SnapshotRequest): Promise<ProviderResult> {
			return fetchEspnSnapshot(request, client);
		}
	};
}

export const espncricinfoProvider: ScoreProvider = createEspncricinfoProvider();
