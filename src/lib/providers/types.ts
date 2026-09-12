export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'abandoned';
export type MatchFormat = 'first-class' | 't20' | 'lista';
export type MatchRound = 'group' | 'quarter-final' | 'semi-final' | 'final';

export type ProviderInnings = {
	number: number;
	battingTeamId: string;
	runs: number;
	wickets: number;
	overs: string;
	declared: boolean;
};

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

export type ProviderScorecardInnings = ProviderInnings & {
	byes: number;
	legByes: number;
	wides: number;
	noBalls: number;
	penalties: number;
	batting: ProviderBatter[];
	bowling: ProviderBowler[];
	fow: ProviderFow[];
};

export type ProviderMatch = {
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
	round: MatchRound | null;
	resultText: string | null;
	followOn: boolean;
	targetRuns: number | null;
	targetBalls: number | null;
	tossWinnerId: string | null;
	tossDecision: string | null;
	dayNumber: number | null;
	session: string | null;
	innings: ProviderInnings[];
	scorecard: ProviderScorecardInnings[] | null;
};

export type ProviderStanding = {
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

export type ParseOk<T> = { ok: true; value: T };
export type ParseFail = { ok: false; error: string };
export type ParseResult<T> = ParseOk<T> | ParseFail;

export type ProviderResult =
	{ ok: true; matches: ProviderMatch[] } | { ok: false; skipped: true; reason: string };

export interface ScoreProvider {
	id: 'espncricinfo' | 'espncricinfo-rss' | 'bbc' | 'cricbuzz';
	label: string;
	/** False when robots/ToS block this source. Never call fetch if false. */
	enabled: boolean;
	reason?: string;
	fetchLiveMatches(): Promise<ProviderResult>;
}

export class NotCutOverError extends Error {
	constructor(provider: string) {
		super(`${provider}: live production scrape is not cut over`);
		this.name = 'NotCutOverError';
	}
}

export class IngestDisabledError extends Error {
	constructor() {
		super('Live ingest is off (ingestion.enabled=false). Seed SQLite is unchanged.');
		this.name = 'IngestDisabledError';
	}
}
