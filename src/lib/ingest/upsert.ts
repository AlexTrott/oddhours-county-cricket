import type {
	ProviderMatch,
	ProviderScorecardInnings,
	ProviderStanding
} from '../providers/types.js';
import { appConfig } from '../config/index.js';
import { getDb } from '../server/db.js';
import { fuzzyMatchExisting } from '../providers/fuzzy.js';
import { setMeta } from './persist.js';

type ExistingRow = {
	id: string;
	sourceKey: string | null;
	competitionId: string;
	homeTeamId: string;
	awayTeamId: string;
	startAt: string;
};

export function loadExistingMatchKeys(): ExistingRow[] {
	const db = getDb();
	return db
		.prepare(
			`SELECT id, source_key AS sourceKey, competition_id AS competitionId,
			        home_team_id AS homeTeamId, away_team_id AS awayTeamId, start_at AS startAt
			 FROM matches`
		)
		.all() as ExistingRow[];
}

function espnMatchId(externalId: string): string {
	return externalId.startsWith('espn-') ? externalId : `espn-${externalId}`;
}

export function upsertMatches(matches: ProviderMatch[], source = 'espncricinfo'): string[] {
	const db = getDb();
	const existing = loadExistingMatchKeys();
	const now = new Date().toISOString();
	const ids: string[] = [];
	const tx = db.transaction(() => {
		for (const match of matches) {
			const matchedId = fuzzyMatchExisting(match, existing) ?? espnMatchId(match.externalId);
			const isNew = !existing.some((row) => row.id === matchedId);
			const insert = db.prepare(`
				INSERT INTO matches (
					id, competition_id, group_id, season, home_team_id, away_team_id, venue,
					start_at, end_at, status, format, day_number, session, result_text,
					follow_on, target_runs, target_balls, toss_winner_id, toss_decision, updated_at,
					round, stale, source, source_key, last_good_at
				) VALUES (
					@id, @competitionId, @groupId, @season, @homeTeamId, @awayTeamId, @venue,
					@startAt, @endAt, @status, @format, @dayNumber, @session, @resultText,
					@followOn, @targetRuns, @targetBalls, @tossWinnerId, @tossDecision, @updatedAt,
					@round, 0, @source, @sourceKey, @lastGoodAt
				)
			`);
			const update = db.prepare(`
				UPDATE matches SET
					competition_id=@competitionId, group_id=@groupId, home_team_id=@homeTeamId,
					away_team_id=@awayTeamId, venue=@venue, start_at=@startAt, end_at=@endAt,
					status=@status, format=@format, day_number=@dayNumber, session=@session,
					result_text=@resultText, follow_on=@followOn, target_runs=@targetRuns,
					target_balls=@targetBalls, toss_winner_id=@tossWinnerId, toss_decision=@tossDecision,
					updated_at=@updatedAt, round=@round, stale=0, source=@source, source_key=@sourceKey,
					last_good_at=@lastGoodAt
				WHERE id=@id
			`);
			const payload = {
				id: matchedId,
				competitionId: match.competitionId,
				groupId: match.groupId,
				season: appConfig.season,
				homeTeamId: match.homeTeamId,
				awayTeamId: match.awayTeamId,
				venue: match.venue,
				startAt: match.startAt,
				endAt: match.endAt,
				status: match.status,
				format: match.format,
				dayNumber: match.dayNumber,
				session: match.session,
				resultText: match.resultText,
				followOn: match.followOn ? 1 : 0,
				targetRuns: match.targetRuns,
				targetBalls: match.targetBalls,
				tossWinnerId: match.tossWinnerId,
				tossDecision: match.tossDecision,
				updatedAt: now,
				round: match.round,
				source,
				sourceKey: match.externalId,
				lastGoodAt: now
			};
			if (isNew) insert.run(payload);
			else update.run(payload);
			if (match.innings.length) replaceInningsTotals(matchedId, match);
			if (match.scorecard?.length) replaceScorecard(matchedId, match.scorecard);
			ids.push(matchedId);
			if (isNew) {
				existing.push({
					id: matchedId,
					sourceKey: match.externalId,
					competitionId: match.competitionId,
					homeTeamId: match.homeTeamId,
					awayTeamId: match.awayTeamId,
					startAt: match.startAt
				});
			}
		}
	});
	tx();
	setMeta('source', source);
	setMeta('updated_at', now);
	return ids;
}

function replaceInningsTotals(matchId: string, match: ProviderMatch): void {
	const db = getDb();
	const existing = db.prepare(`SELECT id FROM innings WHERE match_id = ?`).all(matchId) as Array<{
		id: string;
	}>;
	if (existing.length && !match.scorecard?.length) {
		for (const innings of match.innings) {
			db.prepare(
				`UPDATE innings SET batting_team_id=?, runs=?, wickets=?, overs=?, declared=?
				 WHERE match_id=? AND innings_number=?`
			).run(
				innings.battingTeamId,
				innings.runs,
				innings.wickets,
				innings.overs,
				innings.declared ? 1 : 0,
				matchId,
				innings.number
			);
		}
		return;
	}
	if (!match.scorecard?.length) {
		db.prepare(`DELETE FROM innings WHERE match_id = ?`).run(matchId);
		for (const innings of match.innings) {
			db.prepare(
				`INSERT INTO innings (id, match_id, innings_number, batting_team_id, runs, wickets, overs, declared)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			).run(
				`${matchId}-i${innings.number}`,
				matchId,
				innings.number,
				innings.battingTeamId,
				innings.runs,
				innings.wickets,
				innings.overs,
				innings.declared ? 1 : 0
			);
		}
	}
}

function replaceScorecard(matchId: string, innings: ProviderScorecardInnings[]): void {
	const db = getDb();
	const old = db.prepare(`SELECT id FROM innings WHERE match_id = ?`).all(matchId) as Array<{
		id: string;
	}>;
	for (const row of old) {
		db.prepare(`DELETE FROM batting WHERE innings_id = ?`).run(row.id);
		db.prepare(`DELETE FROM bowling WHERE innings_id = ?`).run(row.id);
		db.prepare(`DELETE FROM fall_of_wicket WHERE innings_id = ?`).run(row.id);
	}
	db.prepare(`DELETE FROM innings WHERE match_id = ?`).run(matchId);
	const insertInnings = db.prepare(`
		INSERT INTO innings (
			id, match_id, innings_number, batting_team_id, runs, wickets, overs, declared,
			byes, leg_byes, wides, no_balls, penalties
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);
	const insertBat = db.prepare(
		`INSERT INTO batting (innings_id, batting_order, player_name, runs, balls, fours, sixes, dismissal, dismissed_by, fielder, is_striker, is_non_striker)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	const insertBowl = db.prepare(
		`INSERT INTO bowling (innings_id, bowling_order, player_name, overs, maidens, runs, wickets)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`
	);
	const insertFow = db.prepare(
		`INSERT INTO fall_of_wicket (innings_id, wicket_number, runs, player_name, overs)
		 VALUES (?, ?, ?, ?, ?)`
	);
	for (const inningsRow of innings) {
		const id = `${matchId}-i${inningsRow.number}`;
		insertInnings.run(
			id,
			matchId,
			inningsRow.number,
			inningsRow.battingTeamId,
			inningsRow.runs,
			inningsRow.wickets,
			inningsRow.overs,
			inningsRow.declared ? 1 : 0,
			inningsRow.byes,
			inningsRow.legByes,
			inningsRow.wides,
			inningsRow.noBalls,
			inningsRow.penalties
		);
		for (const batter of inningsRow.batting) {
			insertBat.run(
				id,
				batter.battingOrder,
				batter.playerName,
				batter.runs,
				batter.balls,
				batter.fours,
				batter.sixes,
				batter.dismissal,
				batter.dismissedBy,
				batter.fielder,
				batter.isStriker ? 1 : 0,
				batter.isNonStriker ? 1 : 0
			);
		}
		for (const bowler of inningsRow.bowling) {
			insertBowl.run(
				id,
				bowler.bowlingOrder,
				bowler.playerName,
				bowler.overs,
				bowler.maidens,
				bowler.runs,
				bowler.wickets
			);
		}
		for (const fow of inningsRow.fow) {
			insertFow.run(id, fow.wicketNumber, fow.runs, fow.playerName, fow.overs);
		}
	}
}

export function upsertStandings(rows: ProviderStanding[], source = 'espncricinfo'): void {
	const db = getDb();
	const now = new Date().toISOString();
	const insert = db.prepare(`
		INSERT INTO standings (
			competition_id, group_id, season, team_id, played, won, lost, drawn, tied,
			no_result, batting_bonus, bowling_bonus, points, deducted, net_run_rate, updated_at
		) VALUES (
			@competitionId, @groupId, @season, @teamId, @played, @won, @lost, @drawn, @tied,
			@noResult, @battingBonus, @bowlingBonus, @points, @deducted, @nrr, @updatedAt
		)
		ON CONFLICT(competition_id, group_id, season, team_id) DO UPDATE SET
			played=excluded.played, won=excluded.won, lost=excluded.lost, drawn=excluded.drawn,
			tied=excluded.tied, no_result=excluded.no_result, batting_bonus=excluded.batting_bonus,
			bowling_bonus=excluded.bowling_bonus, points=excluded.points, deducted=excluded.deducted,
			net_run_rate=excluded.net_run_rate, updated_at=excluded.updated_at
	`);
	const tx = db.transaction(() => {
		for (const row of rows) {
			insert.run({
				competitionId: row.competitionId,
				groupId: row.groupId,
				season: appConfig.season,
				teamId: row.teamId,
				played: row.played,
				won: row.won,
				lost: row.lost,
				drawn: row.drawn,
				tied: row.tied,
				noResult: row.noResult,
				battingBonus: row.battingBonus,
				bowlingBonus: row.bowlingBonus,
				points: row.points,
				deducted: row.deducted,
				nrr: row.netRunRate,
				updatedAt: now
			});
		}
	});
	tx();
	setMeta('source', source);
	setMeta('standings_updated_at', now);
	setMeta('updated_at', now);
}
