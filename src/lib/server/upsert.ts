import { getDb } from './db.js';
import type { ProviderMatchDetail, ProviderStandingRow } from '../providers/types.js';

function deleteMatchChildren(matchId: string): void {
	const db = getDb();
	db.prepare(
		`DELETE FROM fall_of_wicket WHERE innings_id IN (SELECT id FROM innings WHERE match_id = ?)`
	).run(matchId);
	db.prepare(
		`DELETE FROM batting WHERE innings_id IN (SELECT id FROM innings WHERE match_id = ?)`
	).run(matchId);
	db.prepare(
		`DELETE FROM bowling WHERE innings_id IN (SELECT id FROM innings WHERE match_id = ?)`
	).run(matchId);
	db.prepare(`DELETE FROM innings WHERE match_id = ?`).run(matchId);
}

export function deleteMatchCascade(matchId: string): void {
	const db = getDb();
	const tx = db.transaction(() => {
		deleteMatchChildren(matchId);
		db.prepare(`DELETE FROM matches WHERE id = ?`).run(matchId);
	});
	tx();
}

export function deleteSeedMatches(
	competitionId: string,
	season: number,
	groupId?: string | null
): number {
	const db = getDb();
	const clauses = ['competition_id = ?', 'season = ?', `id LIKE '%-%'`];
	const params: unknown[] = [competitionId, season];
	if (groupId) {
		clauses.push('group_id = ?');
		params.push(groupId);
	}
	const rows = db
		.prepare(`SELECT id FROM matches WHERE ${clauses.join(' AND ')}`)
		.all(...params) as Array<{ id: string }>;
	for (const row of rows) deleteMatchCascade(row.id);
	return rows.length;
}

export function upsertMatch(match: ProviderMatchDetail, season: number, updatedAt: string): void {
	const db = getDb();
	const existing = db
		.prepare(`SELECT id FROM innings WHERE match_id = ?`)
		.all(match.externalId) as Array<{
		id: string;
	}>;
	const existingHasCard =
		existing.length > 0 &&
		(
			db
				.prepare(
					`SELECT COUNT(*) AS n FROM batting WHERE innings_id IN (SELECT id FROM innings WHERE match_id = ?)`
				)
				.get(match.externalId) as { n: number }
		).n > 0;

	const replaceCard = match.hasScorecard || !existingHasCard;

	const tx = db.transaction(() => {
		db.prepare(
			`
			INSERT INTO matches (
				id, competition_id, group_id, season, home_team_id, away_team_id, venue,
				start_at, end_at, status, format, day_number, session, result_text,
				follow_on, target_runs, target_balls, toss_winner_id, toss_decision, updated_at
			) VALUES (
				@id, @competitionId, @groupId, @season, @homeTeamId, @awayTeamId, @venue,
				@startAt, @endAt, @status, @format, @dayNumber, @session, @resultText,
				@followOn, @targetRuns, @targetBalls, @tossWinnerId, @tossDecision, @updatedAt
			)
			ON CONFLICT(id) DO UPDATE SET
				competition_id = excluded.competition_id,
				group_id = excluded.group_id,
				home_team_id = excluded.home_team_id,
				away_team_id = excluded.away_team_id,
				venue = excluded.venue,
				start_at = excluded.start_at,
				end_at = excluded.end_at,
				status = excluded.status,
				format = excluded.format,
				day_number = excluded.day_number,
				session = excluded.session,
				result_text = excluded.result_text,
				follow_on = excluded.follow_on,
				target_runs = excluded.target_runs,
				target_balls = excluded.target_balls,
				toss_winner_id = excluded.toss_winner_id,
				toss_decision = excluded.toss_decision,
				updated_at = excluded.updated_at
		`
		).run({
			id: match.externalId,
			competitionId: match.competitionId,
			groupId: match.groupId,
			season,
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
			updatedAt
		});

		if (replaceCard) {
			deleteMatchChildren(match.externalId);
			const insertInnings = db.prepare(`
				INSERT INTO innings (
					id, match_id, innings_number, batting_team_id, runs, wickets, overs, declared,
					byes, leg_byes, wides, no_balls, penalties
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`);
			const insertBat = db.prepare(`
				INSERT INTO batting (
					innings_id, batting_order, player_name, runs, balls, fours, sixes,
					dismissal, dismissed_by, fielder, is_striker, is_non_striker
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`);
			const insertBowl = db.prepare(`
				INSERT INTO bowling (innings_id, bowling_order, player_name, overs, maidens, runs, wickets)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`);
			const insertFow = db.prepare(`
				INSERT INTO fall_of_wicket (innings_id, wicket_number, runs, player_name, overs)
				VALUES (?, ?, ?, ?, ?)
			`);
			for (const innings of match.innings) {
				const inningsId = `${match.externalId}-inn-${innings.number}`;
				insertInnings.run(
					inningsId,
					match.externalId,
					innings.number,
					innings.battingTeamId,
					innings.runs,
					innings.wickets,
					innings.overs,
					innings.declared ? 1 : 0,
					innings.byes,
					innings.legByes,
					innings.wides,
					innings.noBalls,
					innings.penalties
				);
				for (const batter of innings.batting) {
					insertBat.run(
						inningsId,
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
				for (const bowler of innings.bowling) {
					insertBowl.run(
						inningsId,
						bowler.bowlingOrder,
						bowler.playerName,
						bowler.overs,
						bowler.maidens,
						bowler.runs,
						bowler.wickets
					);
				}
				for (const fow of innings.fow) {
					insertFow.run(inningsId, fow.wicketNumber, fow.runs, fow.playerName, fow.overs);
				}
			}
		} else {
			const updateInnings = db.prepare(`
				UPDATE innings SET runs = ?, wickets = ?, overs = ?, declared = ?
				WHERE match_id = ? AND innings_number = ?
			`);
			const insertInnings = db.prepare(`
				INSERT OR IGNORE INTO innings (
					id, match_id, innings_number, batting_team_id, runs, wickets, overs, declared,
					byes, leg_byes, wides, no_balls, penalties
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0)
			`);
			for (const innings of match.innings) {
				const inningsId = `${match.externalId}-inn-${innings.number}`;
				insertInnings.run(
					inningsId,
					match.externalId,
					innings.number,
					innings.battingTeamId,
					innings.runs,
					innings.wickets,
					innings.overs,
					innings.declared ? 1 : 0
				);
				updateInnings.run(
					innings.runs,
					innings.wickets,
					innings.overs,
					innings.declared ? 1 : 0,
					match.externalId,
					innings.number
				);
			}
		}
	});
	tx();
}

export function replaceStandings(
	rows: ProviderStandingRow[],
	season: number,
	updatedAt: string
): void {
	if (!rows.length) return;
	const db = getDb();
	const tx = db.transaction(() => {
		const groups = new Set(rows.map((row) => `${row.competitionId}\t${row.groupId}`));
		const del = db.prepare(
			`DELETE FROM standings WHERE competition_id = ? AND group_id = ? AND season = ?`
		);
		for (const key of groups) {
			const [competitionId, groupId] = key.split('\t');
			del.run(competitionId, groupId, season);
		}
		const insert = db.prepare(`
			INSERT INTO standings (
				competition_id, group_id, season, team_id, played, won, lost, drawn, tied,
				no_result, batting_bonus, bowling_bonus, points, deducted, net_run_rate, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);
		for (const row of rows) {
			insert.run(
				row.competitionId,
				row.groupId,
				season,
				row.teamId,
				row.played,
				row.won,
				row.lost,
				row.drawn,
				row.tied,
				row.noResult,
				row.battingBonus,
				row.bowlingBonus,
				row.points,
				row.deducted,
				row.netRunRate,
				updatedAt
			);
		}
	});
	tx();
}

export function setMeta(key: string, value: string): void {
	const db = getDb();
	db.prepare(
		`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
	).run(key, value);
}
