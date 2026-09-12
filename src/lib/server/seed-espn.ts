import type Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appConfig } from '../config/index.js';
import { parseCompactFixture, parseStandings } from '../providers/espn-parse.js';
import { fuzzyMatchExisting } from '../providers/fuzzy.js';

function seedFile(name: string): string {
	return join(dirname(fileURLToPath(import.meta.url)), '../../../data/seed', name);
}

export function seedCapturedEspn(db: Database.Database, now: string): void {
	const fixturesPath = seedFile('espn-2026-fixtures.json');
	const raw = JSON.parse(readFileSync(fixturesPath, 'utf8')) as {
		events: Array<{
			id: string;
			leagueId: string;
			date?: string | null;
			endDate?: string | null;
			name?: string | null;
			description?: string | null;
			summary?: string | null;
			state?: string | null;
			statusDescription?: string | null;
			venue?: string | null;
			teams: Array<{
				abbreviation?: string | null;
				name?: string | null;
				homeAway?: string | null;
				winner?: string | boolean | null;
				score?: string | null;
				linescores?: unknown[];
			}>;
		}>;
	};

	const existing = db
		.prepare(
			`SELECT id, source_key AS sourceKey, competition_id AS competitionId,
			        home_team_id AS homeTeamId, away_team_id AS awayTeamId, start_at AS startAt
			 FROM matches`
		)
		.all() as Array<{
		id: string;
		sourceKey: string | null;
		competitionId: string;
		homeTeamId: string;
		awayTeamId: string;
		startAt: string;
	}>;

	const insertMatch = db.prepare(`
		INSERT INTO matches (
			id, competition_id, group_id, season, home_team_id, away_team_id, venue,
			start_at, end_at, status, format, day_number, session, result_text,
			follow_on, target_runs, target_balls, toss_winner_id, toss_decision, updated_at,
			round, stale, source, source_key, last_good_at
		) VALUES (
			@id, @competitionId, @groupId, @season, @homeTeamId, @awayTeamId, @venue,
			@startAt, @endAt, @status, @format, @dayNumber, @session, @resultText,
			@followOn, @targetRuns, @targetBalls, @tossWinnerId, @tossDecision, @updatedAt,
			@round, 0, 'seed', @sourceKey, @lastGoodAt
		)
	`);
	const insertInnings = db.prepare(`
		INSERT INTO innings (id, match_id, innings_number, batting_team_id, runs, wickets, overs, declared)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);

	let inserted = 0;
	for (const event of raw.events) {
		const parsed = parseCompactFixture(event);
		if (!parsed.ok) continue;
		const match = parsed.value;
		if (fuzzyMatchExisting(match, existing, 3)) continue;
		const id = `espn-${match.externalId}`;
		insertMatch.run({
			id,
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
			sourceKey: match.externalId,
			lastGoodAt: now
		});
		for (const innings of match.innings) {
			insertInnings.run(
				`${id}-i${innings.number}`,
				id,
				innings.number,
				innings.battingTeamId,
				innings.runs,
				innings.wickets,
				innings.overs,
				innings.declared ? 1 : 0
			);
		}
		existing.push({
			id,
			sourceKey: match.externalId,
			competitionId: match.competitionId,
			homeTeamId: match.homeTeamId,
			awayTeamId: match.awayTeamId,
			startAt: match.startAt
		});
		inserted += 1;
	}

	// Curated seed tables (Championship bonus points) win. ESPN snapshot only fills gaps.
	const standingInsert = db.prepare(`
		INSERT INTO standings (
			competition_id, group_id, season, team_id, played, won, lost, drawn, tied,
			no_result, batting_bonus, bowling_bonus, points, deducted, net_run_rate, updated_at
		) VALUES (
			@competitionId, @groupId, @season, @teamId, @played, @won, @lost, @drawn, @tied,
			@noResult, @battingBonus, @bowlingBonus, @points, @deducted, @nrr, @updatedAt
		)
		ON CONFLICT(competition_id, group_id, season, team_id) DO NOTHING
	`);

	for (const league of appConfig.espn.leagues) {
		const payload = JSON.parse(
			readFileSync(seedFile(`espn-2026-standings-${league.espnId}.json`), 'utf8')
		);
		const parsed = parseStandings(payload, league.espnId);
		if (!parsed.ok) continue;
		for (const row of parsed.value) {
			standingInsert.run({
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
	}

	db.prepare(
		`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
	).run('espn_fixtures_seeded', String(inserted));
}
