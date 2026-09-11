export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'abandoned';
export type MatchFormat = 'first-class' | 't20' | 'lista';

export type ProviderInnings = {
	number: number;
	battingTeamId: string;
	runs: number;
	wickets: number;
	overs: string;
	declared: boolean;
};

export type ProviderMatch = {
	externalId: string;
	competitionId: string;
	groupId: string | null;
	homeTeamId: string;
	awayTeamId: string;
	venue: string;
	startAt: string;
	status: MatchStatus;
	format: MatchFormat;
	resultText: string | null;
	innings: ProviderInnings[];
};

export type ProviderResult =
	{ ok: true; matches: ProviderMatch[] } | { ok: false; skipped: true; reason: string };

export interface ScoreProvider {
	id: 'espncricinfo' | 'bbc' | 'cricbuzz';
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
