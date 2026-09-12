import type { SeriesEntry } from '../config/schema.js';

export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'abandoned';
export type MatchFormat = 'first-class' | 't20' | 'lista';

export type ProviderBatter = {
	battingOrder: number;
	playerName: string;
	runs: number;
	balls: number;
	fours: number;
	sixes: number;
	dismissal: string;
	dismissedBy: string | null;
	fielder: string | null;
	isStriker: boolean;
	isNonStriker: boolean;
};

export type ProviderBowler = {
	bowlingOrder: number;
	playerName: string;
	overs: string;
	maidens: number;
	runs: number;
	wickets: number;
};

export type ProviderFow = {
	wicketNumber: number;
	runs: number;
	playerName: string;
	overs: string;
};

export type ProviderInningsDetail = {
	number: number;
	battingTeamId: string;
	runs: number;
	wickets: number;
	overs: string;
	declared: boolean;
	byes: number;
	legByes: number;
	wides: number;
	noBalls: number;
	penalties: number;
	batting: ProviderBatter[];
	bowling: ProviderBowler[];
	fow: ProviderFow[];
};

export type ProviderMatchDetail = {
	externalId: string;
	competitionId: string;
	groupId: string | null;
	homeTeamId: string;
	awayTeamId: string;
	venue: string;
	startAt: string;
	endAt: string | null;
	status: MatchStatus;
	format: MatchFormat;
	resultText: string | null;
	dayNumber: number | null;
	session: string | null;
	followOn: boolean;
	targetRuns: number | null;
	targetBalls: number | null;
	tossWinnerId: string | null;
	tossDecision: string | null;
	innings: ProviderInningsDetail[];
	hasScorecard: boolean;
};

export type ProviderStandingRow = {
	competitionId: string;
	groupId: string;
	teamId: string;
	played: number;
	won: number;
	lost: number;
	drawn: number;
	tied: number;
	noResult: number;
	battingBonus: number;
	bowlingBonus: number;
	points: number;
	deducted: number;
	netRunRate: number | null;
};

export type ProviderSnapshot = {
	series: SeriesEntry;
	matches: ProviderMatchDetail[];
	standings: ProviderStandingRow[];
};

export type ProviderResult =
	{ ok: true; snapshot: ProviderSnapshot } | { ok: false; skipped: true; reason: string };

export type FetchLiveResult =
	{ ok: true; matches: ProviderMatchDetail[] } | { ok: false; skipped: true; reason: string };

export type HttpGet = (url: string) => Promise<{ status: number; body: string; url: string }>;

export type SnapshotRequest = {
	series: SeriesEntry;
	dates?: string[];
	includeCurrent?: boolean;
	includeStandings?: boolean;
	summaryMatchIds?: string[];
};

export interface ScoreProvider {
	id: 'espncricinfo' | 'bbc' | 'cricbuzz';
	label: string;
	/** False when robots/ToS block this source. Never call fetch if false. */
	enabled: boolean;
	reason?: string;
	fetchLiveMatches(): Promise<FetchLiveResult>;
	fetchSnapshot?(request: SnapshotRequest): Promise<ProviderResult>;
}

export class NotCutOverError extends Error {
	constructor(provider: string) {
		super(`${provider}: live production scrape is not cut over`);
		this.name = 'NotCutOverError';
	}
}

export class IngestNetworkGuardError extends Error {
	constructor() {
		super('Ingest network is disabled in unit tests. Inject a mock get().');
		this.name = 'IngestNetworkGuardError';
	}
}
