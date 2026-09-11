import { appConfig, countyById } from '../config/index.js';
import type {
	BatterRow,
	BowlerRow,
	FowRow,
	InningsScore,
	MatchDetail,
	MatchSummary,
	ScorecardInnings,
	StandingRow
} from '../match-types.js';
import { ensureDatabase } from './db.js';

export type {
	BatterRow,
	BowlerRow,
	FowRow,
	InningsScore,
	MatchDetail,
	MatchSummary,
	ScorecardInnings,
	StandingRow
};

type MatchRecord = {
	id: string;
	competition_id: string;
	group_id: string | null;
	season: number;
	home_team_id: string;
	away_team_id: string;
	venue: string;
	start_at: string;
	end_at: string | null;
	status: MatchSummary['status'];
	format: MatchSummary['format'];
	day_number: number | null;
	session: string | null;
	result_text: string | null;
	follow_on: number;
	target_runs: number | null;
	target_balls: number | null;
	toss_winner_id: string | null;
	toss_decision: string | null;
	updated_at: string;
};

function mapMatch(row: MatchRecord, innings: InningsScore[]): MatchSummary {
	return {
		id: row.id,
		competitionId: row.competition_id,
		groupId: row.group_id,
		season: row.season,
		homeTeamId: row.home_team_id,
		awayTeamId: row.away_team_id,
		venue: row.venue,
		startAt: row.start_at,
		endAt: row.end_at,
		status: row.status,
		format: row.format,
		dayNumber: row.day_number,
		session: row.session,
		resultText: row.result_text,
		followOn: Boolean(row.follow_on),
		targetRuns: row.target_runs,
		targetBalls: row.target_balls,
		tossWinnerId: row.toss_winner_id,
		tossDecision: row.toss_decision,
		updatedAt: row.updated_at,
		innings
	};
}

function loadInnings(matchId: string): InningsScore[] {
	const db = ensureDatabase();
	return db
		.prepare(
			`SELECT id, innings_number AS number, batting_team_id AS battingTeamId, runs, wickets, overs, declared
			 FROM innings WHERE match_id = ? ORDER BY innings_number`
		)
		.all(matchId)
		.map((innings) => {
			const row = innings as InningsScore & { declared: number | boolean };
			return { ...row, declared: Boolean(row.declared) };
		});
}

export function listMatches(
	opts: { status?: MatchSummary['status']; teamId?: string } = {}
): MatchSummary[] {
	const db = ensureDatabase();
	const clauses: string[] = [];
	const params: unknown[] = [];
	if (opts.status) {
		clauses.push('status = ?');
		params.push(opts.status);
	}
	if (opts.teamId) {
		clauses.push('(home_team_id = ? OR away_team_id = ?)');
		params.push(opts.teamId, opts.teamId);
	}
	const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
	const rows = db
		.prepare(
			`SELECT * FROM matches ${where}
			 ORDER BY CASE status WHEN 'live' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END, start_at`
		)
		.all(...params) as MatchRecord[];
	return rows.map((row) => mapMatch(row, loadInnings(row.id)));
}

export function getMatch(id: string): MatchDetail | null {
	const db = ensureDatabase();
	const row = db.prepare(`SELECT * FROM matches WHERE id = ?`).get(id) as MatchRecord | undefined;
	if (!row) return null;
	const inningsRows = db
		.prepare(`SELECT * FROM innings WHERE match_id = ? ORDER BY innings_number`)
		.all(id) as Array<{
		id: string;
		innings_number: number;
		batting_team_id: string;
		runs: number;
		wickets: number;
		overs: string;
		declared: number;
		byes: number;
		leg_byes: number;
		wides: number;
		no_balls: number;
		penalties: number;
	}>;
	const innings: ScorecardInnings[] = inningsRows.map((inningsRow) => {
		const batting = db
			.prepare(
				`SELECT batting_order AS battingOrder, player_name AS playerName, runs, balls, fours, sixes,
				        dismissal, dismissed_by AS dismissedBy, fielder, is_striker AS isStriker, is_non_striker AS isNonStriker
				 FROM batting WHERE innings_id = ? ORDER BY batting_order`
			)
			.all(inningsRow.id) as Array<
			BatterRow & { isStriker: number | boolean; isNonStriker: number | boolean }
		>;
		const bowling = db
			.prepare(
				`SELECT bowling_order AS bowlingOrder, player_name AS playerName, overs, maidens, runs, wickets
				 FROM bowling WHERE innings_id = ? ORDER BY bowling_order`
			)
			.all(inningsRow.id) as BowlerRow[];
		const fow = db
			.prepare(
				`SELECT wicket_number AS wicketNumber, runs, player_name AS playerName, overs
				 FROM fall_of_wicket WHERE innings_id = ? ORDER BY wicket_number`
			)
			.all(inningsRow.id) as FowRow[];
		return {
			id: inningsRow.id,
			number: inningsRow.innings_number,
			battingTeamId: inningsRow.batting_team_id,
			runs: inningsRow.runs,
			wickets: inningsRow.wickets,
			overs: inningsRow.overs,
			declared: Boolean(inningsRow.declared),
			byes: inningsRow.byes,
			legByes: inningsRow.leg_byes,
			wides: inningsRow.wides,
			noBalls: inningsRow.no_balls,
			penalties: inningsRow.penalties,
			batting: batting.map((batter) => ({
				...batter,
				isStriker: Boolean(batter.isStriker),
				isNonStriker: Boolean(batter.isNonStriker)
			})),
			bowling,
			fow
		};
	});
	return { ...mapMatch(row, innings), innings };
}

export function listStandings(competitionId: string, groupId: string): StandingRow[] {
	const db = ensureDatabase();
	return db
		.prepare(
			`SELECT team_id AS teamId, played, won, lost, drawn, tied, no_result AS noResult,
			        batting_bonus AS battingBonus, bowling_bonus AS bowlingBonus, points, deducted,
			        net_run_rate AS netRunRate
			 FROM standings
			 WHERE competition_id = ? AND group_id = ? AND season = ?
			 ORDER BY points DESC, net_run_rate DESC, won DESC`
		)
		.all(competitionId, groupId, appConfig.season) as StandingRow[];
}

export function getMeta(key: string): string | null {
	const db = ensureDatabase();
	const row = db.prepare(`SELECT value FROM meta WHERE key = ?`).get(key) as
		{ value: string } | undefined;
	return row?.value ?? null;
}

export function healthSnapshot() {
	const db = ensureDatabase();
	const matches = db.prepare(`SELECT COUNT(*) AS n FROM matches`).get() as { n: number };
	const live = db.prepare(`SELECT COUNT(*) AS n FROM matches WHERE status = 'live'`).get() as {
		n: number;
	};
	return {
		ok: true as const,
		service: 'county-cricket-live',
		db: 'ok',
		matches: matches.n,
		live: live.n,
		source: getMeta('source') ?? 'unknown',
		updated_at: getMeta('updated_at'),
		season: appConfig.season
	};
}

export function displayName(teamId: string): string {
	return countyById[teamId]?.shortName ?? teamId;
}
