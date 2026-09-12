export type InningsScore = {
	id: string;
	number: number;
	battingTeamId: string;
	runs: number;
	wickets: number;
	overs: string;
	declared: boolean;
};

export type MatchSummary = {
	id: string;
	competitionId: string;
	groupId: string | null;
	season: number;
	homeTeamId: string;
	awayTeamId: string;
	venue: string;
	startAt: string;
	endAt: string | null;
	status: 'upcoming' | 'live' | 'completed' | 'abandoned';
	format: 'first-class' | 't20' | 'lista';
	dayNumber: number | null;
	session: string | null;
	resultText: string | null;
	followOn: boolean;
	targetRuns: number | null;
	targetBalls: number | null;
	tossWinnerId: string | null;
	tossDecision: string | null;
	updatedAt: string;
	innings: InningsScore[];
};

export type BatterRow = {
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

export type BowlerRow = {
	bowlingOrder: number;
	playerName: string;
	overs: string;
	maidens: number;
	runs: number;
	wickets: number;
};

export type FowRow = {
	wicketNumber: number;
	runs: number;
	playerName: string;
	overs: string;
};

export type ScorecardInnings = InningsScore & {
	byes: number;
	legByes: number;
	wides: number;
	noBalls: number;
	penalties: number;
	batting: BatterRow[];
	bowling: BowlerRow[];
	fow: FowRow[];
};

export type MatchDetail = Omit<MatchSummary, 'innings'> & {
	innings: ScorecardInnings[];
};

export type StandingRow = {
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
