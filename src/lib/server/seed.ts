import type Database from 'better-sqlite3';
import { appConfig } from '../config/index.js';

type Bat = {
	name: string;
	runs: number;
	balls: number;
	fours?: number;
	sixes?: number;
	dismissal: string;
	bowler?: string;
	fielder?: string;
	striker?: boolean;
	nonStriker?: boolean;
};

type Bowl = {
	name: string;
	overs: string;
	maidens?: number;
	runs: number;
	wickets: number;
};

type Fow = { wicket: number; runs: number; name: string; overs: string };

type Standing = {
	competitionId: string;
	groupId: string;
	teamId: string;
	played: number;
	won: number;
	lost: number;
	drawn?: number;
	tied?: number;
	noResult?: number;
	battingBonus?: number;
	bowlingBonus?: number;
	points: number;
	deducted?: number;
	nrr?: number | null;
};

export function seedDatabase(db: Database.Database): void {
	const now = new Date().toISOString();
	const insertMatch = db.prepare(`
		INSERT INTO matches (
			id, competition_id, group_id, season, home_team_id, away_team_id, venue,
			start_at, end_at, status, format, day_number, session, result_text,
			follow_on, target_runs, target_balls, toss_winner_id, toss_decision, updated_at
		) VALUES (
			@id, @competitionId, @groupId, @season, @homeTeamId, @awayTeamId, @venue,
			@startAt, @endAt, @status, @format, @dayNumber, @session, @resultText,
			@followOn, @targetRuns, @targetBalls, @tossWinnerId, @tossDecision, @updatedAt
		)
	`);
	const insertInnings = db.prepare(`
		INSERT INTO innings (
			id, match_id, innings_number, batting_team_id, runs, wickets, overs, declared,
			byes, leg_byes, wides, no_balls, penalties
		) VALUES (
			@id, @matchId, @number, @battingTeamId, @runs, @wickets, @overs, @declared,
			@byes, @legByes, @wides, @noBalls, @penalties
		)
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
	const insertStanding = db.prepare(`
		INSERT INTO standings (
			competition_id, group_id, season, team_id, played, won, lost, drawn, tied,
			no_result, batting_bonus, bowling_bonus, points, deducted, net_run_rate, updated_at
		) VALUES (
			@competitionId, @groupId, @season, @teamId, @played, @won, @lost, @drawn, @tied,
			@noResult, @battingBonus, @bowlingBonus, @points, @deducted, @nrr, @updatedAt
		)
	`);
	const insertMeta = db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)`);

	const tx = db.transaction(() => {
		function innings(opts: {
			id: string;
			matchId: string;
			number: number;
			battingTeamId: string;
			runs: number;
			wickets: number;
			overs: string;
			declared?: boolean;
			extras?: {
				byes?: number;
				legByes?: number;
				wides?: number;
				noBalls?: number;
				penalties?: number;
			};
			batting: Bat[];
			bowling: Bowl[];
			fow: Fow[];
		}) {
			insertInnings.run({
				id: opts.id,
				matchId: opts.matchId,
				number: opts.number,
				battingTeamId: opts.battingTeamId,
				runs: opts.runs,
				wickets: opts.wickets,
				overs: opts.overs,
				declared: opts.declared ? 1 : 0,
				byes: opts.extras?.byes ?? 0,
				legByes: opts.extras?.legByes ?? 0,
				wides: opts.extras?.wides ?? 0,
				noBalls: opts.extras?.noBalls ?? 0,
				penalties: opts.extras?.penalties ?? 0
			});
			opts.batting.forEach((row, index) => {
				insertBat.run(
					opts.id,
					index + 1,
					row.name,
					row.runs,
					row.balls,
					row.fours ?? 0,
					row.sixes ?? 0,
					row.dismissal,
					row.bowler ?? null,
					row.fielder ?? null,
					row.striker ? 1 : 0,
					row.nonStriker ? 1 : 0
				);
			});
			opts.bowling.forEach((row, index) => {
				insertBowl.run(
					opts.id,
					index + 1,
					row.name,
					row.overs,
					row.maidens ?? 0,
					row.runs,
					row.wickets
				);
			});
			for (const row of opts.fow) {
				insertFow.run(opts.id, row.wicket, row.runs, row.name, row.overs);
			}
		}

		insertMatch.run({
			id: '2026-cc-not-sur',
			competitionId: 'championship',
			groupId: 'division-one',
			season: appConfig.season,
			homeTeamId: 'nottinghamshire',
			awayTeamId: 'surrey',
			venue: 'Trent Bridge',
			startAt: '2026-09-10T10:00:00.000Z',
			endAt: null,
			status: 'live',
			format: 'first-class',
			dayNumber: 2,
			session: 'afternoon',
			resultText: null,
			followOn: 0,
			targetRuns: null,
			targetBalls: null,
			tossWinnerId: 'surrey',
			tossDecision: 'bat',
			updatedAt: now
		});

		innings({
			id: '2026-cc-not-sur-i1',
			matchId: '2026-cc-not-sur',
			number: 1,
			battingTeamId: 'surrey',
			runs: 412,
			wickets: 10,
			overs: '118.4',
			extras: { byes: 8, legByes: 11, wides: 2, noBalls: 4 },
			batting: [
				{
					name: 'Rory Burns',
					runs: 86,
					balls: 164,
					fours: 11,
					dismissal: 'caught',
					bowler: 'Pennington',
					fielder: 'Clarke'
				},
				{
					name: 'Dom Sibley',
					runs: 54,
					balls: 121,
					fours: 6,
					dismissal: 'lbw',
					bowler: 'Patterson-White'
				},
				{
					name: 'Ollie Pope',
					runs: 102,
					balls: 148,
					fours: 12,
					sixes: 1,
					dismissal: 'caught',
					bowler: 'James',
					fielder: 'Hameed'
				},
				{
					name: 'Jamie Smith',
					runs: 47,
					balls: 62,
					fours: 5,
					sixes: 1,
					dismissal: 'bowled',
					bowler: 'Fletcher'
				},
				{
					name: 'Ben Foakes',
					runs: 38,
					balls: 71,
					fours: 4,
					dismissal: 'caught',
					bowler: 'Pennington',
					fielder: 'Moores'
				},
				{
					name: 'Ryan Patel',
					runs: 22,
					balls: 41,
					fours: 3,
					dismissal: 'caught',
					bowler: 'James',
					fielder: 'Slater'
				},
				{
					name: 'Cameron Steel',
					runs: 19,
					balls: 33,
					fours: 2,
					dismissal: 'lbw',
					bowler: 'Patterson-White'
				},
				{
					name: 'Jordan Clark',
					runs: 16,
					balls: 28,
					fours: 2,
					dismissal: 'bowled',
					bowler: 'Fletcher'
				},
				{
					name: 'Tom Lawes',
					runs: 8,
					balls: 19,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Pennington',
					fielder: 'Clarke'
				},
				{ name: 'Dan Worrall', runs: 7, balls: 11, fours: 1, dismissal: 'not out' },
				{ name: 'Kemar Roach', runs: 4, balls: 9, dismissal: 'bowled', bowler: 'James' }
			],
			bowling: [
				{ name: 'Dillon Pennington', overs: '26', maidens: 4, runs: 78, wickets: 3 },
				{ name: 'Luke Fletcher', overs: '24', maidens: 5, runs: 71, wickets: 2 },
				{ name: 'Lyndon James', overs: '22.4', maidens: 3, runs: 82, wickets: 3 },
				{ name: 'Liam Patterson-White', overs: '28', maidens: 6, runs: 89, wickets: 2 },
				{ name: 'Calvin Harrison', overs: '18', maidens: 2, runs: 67, wickets: 0 }
			],
			fow: [
				{ wicket: 1, runs: 92, name: 'Sibley', overs: '31.2' },
				{ wicket: 2, runs: 201, name: 'Burns', overs: '62.1' },
				{ wicket: 3, runs: 288, name: 'Pope', overs: '84.5' },
				{ wicket: 4, runs: 331, name: 'Smith', overs: '94.3' },
				{ wicket: 5, runs: 361, name: 'Foakes', overs: '103.1' },
				{ wicket: 6, runs: 379, name: 'Patel', overs: '108.4' },
				{ wicket: 7, runs: 394, name: 'Steel', overs: '112.2' },
				{ wicket: 8, runs: 401, name: 'Clark', overs: '115.0' },
				{ wicket: 9, runs: 407, name: 'Lawes', overs: '117.1' },
				{ wicket: 10, runs: 412, name: 'Roach', overs: '118.4' }
			]
		});

		innings({
			id: '2026-cc-not-sur-i2',
			matchId: '2026-cc-not-sur',
			number: 2,
			battingTeamId: 'nottinghamshire',
			runs: 287,
			wickets: 10,
			overs: '86.2',
			extras: { byes: 4, legByes: 9, noBalls: 3 },
			batting: [
				{
					name: 'Haseeb Hameed',
					runs: 41,
					balls: 88,
					fours: 5,
					dismissal: 'caught',
					bowler: 'Worrall',
					fielder: 'Foakes'
				},
				{ name: 'Ben Slater', runs: 22, balls: 47, fours: 3, dismissal: 'lbw', bowler: 'Roach' },
				{
					name: 'Joe Clarke',
					runs: 63,
					balls: 91,
					fours: 8,
					sixes: 1,
					dismissal: 'caught',
					bowler: 'Clark',
					fielder: 'Pope'
				},
				{
					name: 'Jack Haynes',
					runs: 18,
					balls: 39,
					fours: 2,
					dismissal: 'bowled',
					bowler: 'Lawes'
				},
				{
					name: 'Lyndon James',
					runs: 55,
					balls: 84,
					fours: 6,
					dismissal: 'caught',
					bowler: 'Worrall',
					fielder: 'Smith'
				},
				{ name: 'Tom Moores', runs: 27, balls: 41, fours: 3, dismissal: 'lbw', bowler: 'Steel' },
				{
					name: 'Liam Patterson-White',
					runs: 19,
					balls: 36,
					fours: 2,
					dismissal: 'caught',
					bowler: 'Clark',
					fielder: 'Foakes'
				},
				{
					name: 'Calvin Harrison',
					runs: 12,
					balls: 22,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Roach',
					fielder: 'Burns'
				},
				{ name: 'Dillon Pennington', runs: 9, balls: 17, fours: 1, dismissal: 'not out' },
				{ name: 'Luke Fletcher', runs: 4, balls: 8, dismissal: 'bowled', bowler: 'Worrall' },
				{ name: 'Dane Paterson', runs: 0, balls: 3, dismissal: 'lbw', bowler: 'Worrall' }
			],
			bowling: [
				{ name: 'Dan Worrall', overs: '20.2', maidens: 4, runs: 61, wickets: 3 },
				{ name: 'Kemar Roach', overs: '18', maidens: 3, runs: 54, wickets: 2 },
				{ name: 'Jordan Clark', overs: '16', maidens: 2, runs: 58, wickets: 2 },
				{ name: 'Tom Lawes', overs: '14', maidens: 2, runs: 49, wickets: 1 },
				{ name: 'Cameron Steel', overs: '18', maidens: 3, runs: 52, wickets: 1 }
			],
			fow: [
				{ wicket: 1, runs: 48, name: 'Slater', overs: '16.4' },
				{ wicket: 2, runs: 97, name: 'Hameed', overs: '32.1' },
				{ wicket: 3, runs: 141, name: 'Haynes', overs: '45.3' },
				{ wicket: 4, runs: 188, name: 'Clarke', overs: '58.2' },
				{ wicket: 5, runs: 236, name: 'James', overs: '71.5' },
				{ wicket: 6, runs: 258, name: 'Moores', overs: '78.1' },
				{ wicket: 7, runs: 271, name: 'Patterson-White', overs: '82.0' },
				{ wicket: 8, runs: 281, name: 'Harrison', overs: '84.3' },
				{ wicket: 9, runs: 287, name: 'Fletcher', overs: '85.4' },
				{ wicket: 10, runs: 287, name: 'Paterson', overs: '86.2' }
			]
		});

		innings({
			id: '2026-cc-not-sur-i3',
			matchId: '2026-cc-not-sur',
			number: 3,
			battingTeamId: 'surrey',
			runs: 86,
			wickets: 2,
			overs: '28.0',
			extras: { legByes: 4, noBalls: 1 },
			batting: [
				{
					name: 'Rory Burns',
					runs: 31,
					balls: 64,
					fours: 4,
					dismissal: 'not out',
					nonStriker: true
				},
				{
					name: 'Dom Sibley',
					runs: 28,
					balls: 51,
					fours: 3,
					dismissal: 'caught',
					bowler: 'Pennington',
					fielder: 'Moores'
				},
				{
					name: 'Ollie Pope',
					runs: 18,
					balls: 36,
					fours: 2,
					dismissal: 'lbw',
					bowler: 'Patterson-White'
				},
				{ name: 'Jamie Smith', runs: 4, balls: 17, fours: 0, dismissal: 'not out', striker: true }
			],
			bowling: [
				{ name: 'Dillon Pennington', overs: '8', maidens: 2, runs: 22, wickets: 1 },
				{ name: 'Luke Fletcher', overs: '7', maidens: 1, runs: 19, wickets: 0 },
				{ name: 'Lyndon James', overs: '6', maidens: 1, runs: 21, wickets: 0 },
				{ name: 'Liam Patterson-White', overs: '7', maidens: 2, runs: 20, wickets: 1 }
			],
			fow: [
				{ wicket: 1, runs: 49, name: 'Sibley', overs: '16.3' },
				{ wicket: 2, runs: 74, name: 'Pope', overs: '24.1' }
			]
		});

		insertMatch.run({
			id: '2026-bl-yor-not',
			competitionId: 'blast',
			groupId: 'group-a',
			season: appConfig.season,
			homeTeamId: 'yorkshire',
			awayTeamId: 'nottinghamshire',
			venue: 'Headingley',
			startAt: '2026-09-11T17:30:00.000Z',
			endAt: null,
			status: 'live',
			format: 't20',
			dayNumber: null,
			session: null,
			resultText: null,
			followOn: 0,
			targetRuns: 179,
			targetBalls: 120,
			tossWinnerId: 'nottinghamshire',
			tossDecision: 'bowl',
			updatedAt: now
		});

		innings({
			id: '2026-bl-yor-not-i1',
			matchId: '2026-bl-yor-not',
			number: 1,
			battingTeamId: 'yorkshire',
			runs: 178,
			wickets: 6,
			overs: '20.0',
			extras: { wides: 6, legByes: 4, noBalls: 1 },
			batting: [
				{
					name: 'Adam Lyth',
					runs: 42,
					balls: 28,
					fours: 5,
					sixes: 2,
					dismissal: 'caught',
					bowler: 'Ferguson',
					fielder: 'Clarke'
				},
				{
					name: 'Dawid Malan',
					runs: 36,
					balls: 24,
					fours: 4,
					sixes: 1,
					dismissal: 'caught',
					bowler: 'Patterson-White',
					fielder: 'James'
				},
				{
					name: 'Joe Root',
					runs: 48,
					balls: 31,
					fours: 4,
					sixes: 2,
					dismissal: 'caught',
					bowler: 'Pennington',
					fielder: 'Montgomery'
				},
				{
					name: 'Harry Brook',
					runs: 22,
					balls: 15,
					fours: 1,
					sixes: 1,
					dismissal: 'bowled',
					bowler: 'Ferguson'
				},
				{
					name: 'Jonny Bairstow',
					runs: 14,
					balls: 10,
					fours: 1,
					sixes: 1,
					dismissal: 'caught',
					bowler: 'James',
					fielder: 'Moores'
				},
				{ name: 'Dom Bess', runs: 6, balls: 7, dismissal: 'run out', fielder: 'Hameed' },
				{ name: 'Jordan Thompson', runs: 5, balls: 5, dismissal: 'not out' }
			],
			bowling: [
				{ name: 'Lockie Ferguson', overs: '4', maidens: 0, runs: 31, wickets: 2 },
				{ name: 'Dillon Pennington', overs: '4', maidens: 0, runs: 38, wickets: 1 },
				{ name: 'Lyndon James', overs: '4', maidens: 0, runs: 34, wickets: 1 },
				{ name: 'Liam Patterson-White', overs: '4', maidens: 0, runs: 33, wickets: 1 },
				{ name: 'Calvin Harrison', overs: '4', maidens: 0, runs: 36, wickets: 0 }
			],
			fow: [
				{ wicket: 1, runs: 71, name: 'Lyth', overs: '8.1' },
				{ wicket: 2, runs: 108, name: 'Malan', overs: '11.4' },
				{ wicket: 3, runs: 148, name: 'Root', overs: '16.2' },
				{ wicket: 4, runs: 161, name: 'Brook', overs: '17.5' },
				{ wicket: 5, runs: 169, name: 'Bairstow', overs: '18.4' },
				{ wicket: 6, runs: 173, name: 'Bess', overs: '19.2' }
			]
		});

		innings({
			id: '2026-bl-yor-not-i2',
			matchId: '2026-bl-yor-not',
			number: 2,
			battingTeamId: 'nottinghamshire',
			runs: 148,
			wickets: 4,
			overs: '16.2',
			extras: { wides: 5, legByes: 3 },
			batting: [
				{
					name: 'Joe Clarke',
					runs: 41,
					balls: 24,
					fours: 4,
					sixes: 2,
					dismissal: 'caught',
					bowler: 'Thompson',
					fielder: 'Bairstow'
				},
				{ name: 'Ben Slater', runs: 18, balls: 14, fours: 2, dismissal: 'lbw', bowler: 'Bess' },
				{
					name: 'Jack Haynes',
					runs: 33,
					balls: 22,
					fours: 3,
					sixes: 1,
					dismissal: 'caught',
					bowler: 'Thompson',
					fielder: 'Brook'
				},
				{
					name: 'Lyndon James',
					runs: 28,
					balls: 21,
					fours: 2,
					sixes: 1,
					dismissal: 'not out',
					nonStriker: true
				},
				{
					name: 'Tom Moores',
					runs: 9,
					balls: 8,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Revis',
					fielder: 'Lyth'
				},
				{
					name: 'Matthew Montgomery',
					runs: 11,
					balls: 9,
					fours: 1,
					dismissal: 'not out',
					striker: true
				}
			],
			bowling: [
				{ name: 'Jordan Thompson', overs: '3.2', maidens: 0, runs: 29, wickets: 2 },
				{ name: 'Ben Coad', overs: '3', maidens: 0, runs: 27, wickets: 0 },
				{ name: 'Dom Bess', overs: '3', maidens: 0, runs: 24, wickets: 1 },
				{ name: 'Matthew Revis', overs: '3', maidens: 0, runs: 31, wickets: 1 },
				{ name: 'Dan Moriarty', overs: '4', maidens: 0, runs: 31, wickets: 0 }
			],
			fow: [
				{ wicket: 1, runs: 44, name: 'Slater', overs: '4.3' },
				{ wicket: 2, runs: 88, name: 'Clarke', overs: '9.1' },
				{ wicket: 3, runs: 121, name: 'Haynes', overs: '13.0' },
				{ wicket: 4, runs: 133, name: 'Moores', overs: '14.4' }
			]
		});

		insertMatch.run({
			id: '2026-cc-ham-sus',
			competitionId: 'championship',
			groupId: 'division-one',
			season: appConfig.season,
			homeTeamId: 'hampshire',
			awayTeamId: 'sussex',
			venue: 'Southampton',
			startAt: '2026-09-06T10:00:00.000Z',
			endAt: '2026-09-09T16:42:00.000Z',
			status: 'completed',
			format: 'first-class',
			dayNumber: 4,
			session: null,
			resultText: 'Hampshire won by 7 wickets',
			followOn: 0,
			targetRuns: 148,
			targetBalls: null,
			tossWinnerId: 'sussex',
			tossDecision: 'bat',
			updatedAt: now
		});

		innings({
			id: '2026-cc-ham-sus-i1',
			matchId: '2026-cc-ham-sus',
			number: 1,
			battingTeamId: 'sussex',
			runs: 221,
			wickets: 10,
			overs: '68.3',
			batting: [
				{
					name: 'Tom Haines',
					runs: 34,
					balls: 71,
					fours: 4,
					dismissal: 'caught',
					bowler: 'Abbott',
					fielder: 'Brown'
				},
				{
					name: 'Daniel Hughes',
					runs: 51,
					balls: 88,
					fours: 6,
					dismissal: 'caught',
					bowler: 'Abbott',
					fielder: 'Gubbins'
				},
				{ name: 'Tom Alsop', runs: 18, balls: 40, fours: 2, dismissal: 'lbw', bowler: 'Organ' },
				{
					name: 'James Coles',
					runs: 42,
					balls: 67,
					fours: 5,
					dismissal: 'bowled',
					bowler: 'Abbott'
				},
				{
					name: 'John Simpson',
					runs: 29,
					balls: 44,
					fours: 3,
					dismissal: 'caught',
					bowler: 'Wheal',
					fielder: 'Brown'
				},
				{
					name: 'Fynn Hudson-Prentice',
					runs: 15,
					balls: 22,
					fours: 2,
					dismissal: 'lbw',
					bowler: 'Abbott'
				},
				{
					name: 'Jack Carson',
					runs: 12,
					balls: 19,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Wheal',
					fielder: 'Prest'
				},
				{ name: 'Ollie Robinson', runs: 9, balls: 16, fours: 1, dismissal: 'not out' },
				{ name: 'Ari Karvelas', runs: 4, balls: 11, dismissal: 'bowled', bowler: 'Abbott' },
				{ name: 'Henry Crocombe', runs: 2, balls: 7, dismissal: 'lbw', bowler: 'Organ' },
				{
					name: 'Sean Hunt',
					runs: 0,
					balls: 2,
					dismissal: 'caught',
					bowler: 'Abbott',
					fielder: 'Brown'
				}
			],
			bowling: [
				{ name: 'Kyle Abbott', overs: '18.3', maidens: 4, runs: 52, wickets: 5 },
				{ name: 'Brad Wheal', overs: '16', maidens: 2, runs: 48, wickets: 2 },
				{ name: 'Felix Organ', overs: '19', maidens: 3, runs: 61, wickets: 2 },
				{ name: 'Keith Barker', overs: '15', maidens: 3, runs: 55, wickets: 0 }
			],
			fow: [
				{ wicket: 1, runs: 61, name: 'Haines', overs: '21.2' },
				{ wicket: 2, runs: 98, name: 'Alsop', overs: '33.4' },
				{ wicket: 3, runs: 141, name: 'Hughes', overs: '44.1' },
				{ wicket: 4, runs: 178, name: 'Coles', overs: '54.3' },
				{ wicket: 5, runs: 198, name: 'Simpson', overs: '59.5' },
				{ wicket: 6, runs: 205, name: 'Hudson-Prentice', overs: '62.2' },
				{ wicket: 7, runs: 212, name: 'Carson', overs: '64.4' },
				{ wicket: 8, runs: 218, name: 'Karvelas', overs: '66.5' },
				{ wicket: 9, runs: 221, name: 'Crocombe', overs: '67.5' },
				{ wicket: 10, runs: 221, name: 'Hunt', overs: '68.3' }
			]
		});

		innings({
			id: '2026-cc-ham-sus-i2',
			matchId: '2026-cc-ham-sus',
			number: 2,
			battingTeamId: 'hampshire',
			runs: 304,
			wickets: 10,
			overs: '91.1',
			declared: false,
			batting: [
				{
					name: 'Ali Orr',
					runs: 28,
					balls: 51,
					fours: 4,
					dismissal: 'caught',
					bowler: 'Robinson',
					fielder: 'Simpson'
				},
				{
					name: 'Fletcha Middleton',
					runs: 46,
					balls: 79,
					fours: 5,
					dismissal: 'lbw',
					bowler: 'Karvelas'
				},
				{
					name: 'Nick Gubbins',
					runs: 81,
					balls: 132,
					fours: 9,
					dismissal: 'caught',
					bowler: 'Carson',
					fielder: 'Haines'
				},
				{
					name: 'James Vince',
					runs: 55,
					balls: 74,
					fours: 7,
					dismissal: 'bowled',
					bowler: 'Robinson'
				},
				{
					name: 'Ben Brown',
					runs: 33,
					balls: 58,
					fours: 3,
					dismissal: 'caught',
					bowler: 'Carson',
					fielder: 'Simpson'
				},
				{ name: 'Liam Dawson', runs: 22, balls: 41, fours: 2, dismissal: 'lbw', bowler: 'Coles' },
				{
					name: 'Felix Organ',
					runs: 14,
					balls: 29,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Robinson',
					fielder: 'Coles'
				},
				{ name: 'Keith Barker', runs: 9, balls: 18, fours: 1, dismissal: 'not out' },
				{
					name: 'Kyle Abbott',
					runs: 6,
					balls: 12,
					dismissal: 'caught',
					bowler: 'Hunt',
					fielder: 'Alsop'
				},
				{ name: 'Brad Wheal', runs: 4, balls: 9, dismissal: 'bowled', bowler: 'Robinson' },
				{ name: 'Sonny Baker', runs: 1, balls: 5, dismissal: 'lbw', bowler: 'Robinson' }
			],
			bowling: [
				{ name: 'Ollie Robinson', overs: '22.1', maidens: 4, runs: 68, wickets: 4 },
				{ name: 'Ari Karvelas', overs: '18', maidens: 2, runs: 59, wickets: 1 },
				{ name: 'Jack Carson', overs: '24', maidens: 3, runs: 81, wickets: 2 },
				{ name: 'Sean Hunt', overs: '15', maidens: 2, runs: 52, wickets: 1 },
				{ name: 'James Coles', overs: '12', maidens: 1, runs: 39, wickets: 1 }
			],
			fow: [
				{ wicket: 1, runs: 51, name: 'Orr', overs: '17.3' },
				{ wicket: 2, runs: 112, name: 'Middleton', overs: '35.1' },
				{ wicket: 3, runs: 198, name: 'Vince', overs: '58.4' },
				{ wicket: 4, runs: 241, name: 'Gubbins', overs: '72.2' },
				{ wicket: 5, runs: 268, name: 'Brown', overs: '80.5' },
				{ wicket: 6, runs: 281, name: 'Dawson', overs: '84.1' },
				{ wicket: 7, runs: 290, name: 'Organ', overs: '87.0' },
				{ wicket: 8, runs: 297, name: 'Abbott', overs: '89.1' },
				{ wicket: 9, runs: 302, name: 'Wheal', overs: '90.2' },
				{ wicket: 10, runs: 304, name: 'Baker', overs: '91.1' }
			]
		});

		innings({
			id: '2026-cc-ham-sus-i3',
			matchId: '2026-cc-ham-sus',
			number: 3,
			battingTeamId: 'sussex',
			runs: 230,
			wickets: 10,
			overs: '71.4',
			batting: [
				{
					name: 'Tom Haines',
					runs: 62,
					balls: 104,
					fours: 8,
					dismissal: 'caught',
					bowler: 'Abbott',
					fielder: 'Vince'
				},
				{
					name: 'Daniel Hughes',
					runs: 19,
					balls: 33,
					fours: 3,
					dismissal: 'lbw',
					bowler: 'Abbott'
				},
				{
					name: 'Tom Alsop',
					runs: 44,
					balls: 81,
					fours: 5,
					dismissal: 'caught',
					bowler: 'Dawson',
					fielder: 'Gubbins'
				},
				{
					name: 'James Coles',
					runs: 31,
					balls: 55,
					fours: 3,
					dismissal: 'bowled',
					bowler: 'Organ'
				},
				{
					name: 'John Simpson',
					runs: 27,
					balls: 46,
					fours: 3,
					dismissal: 'caught',
					bowler: 'Abbott',
					fielder: 'Brown'
				},
				{
					name: 'Fynn Hudson-Prentice',
					runs: 18,
					balls: 29,
					fours: 2,
					dismissal: 'caught',
					bowler: 'Wheal',
					fielder: 'Orr'
				},
				{
					name: 'Jack Carson',
					runs: 11,
					balls: 21,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Dawson',
					fielder: 'Vince'
				},
				{
					name: 'Ollie Robinson',
					runs: 8,
					balls: 14,
					fours: 1,
					dismissal: 'lbw',
					bowler: 'Abbott'
				},
				{ name: 'Ari Karvelas', runs: 4, balls: 9, dismissal: 'not out' },
				{ name: 'Henry Crocombe', runs: 2, balls: 6, dismissal: 'bowled', bowler: 'Abbott' },
				{
					name: 'Sean Hunt',
					runs: 1,
					balls: 4,
					dismissal: 'caught',
					bowler: 'Abbott',
					fielder: 'Brown'
				}
			],
			bowling: [
				{ name: 'Kyle Abbott', overs: '18.4', maidens: 3, runs: 55, wickets: 5 },
				{ name: 'Brad Wheal', overs: '14', maidens: 2, runs: 44, wickets: 1 },
				{ name: 'Liam Dawson', overs: '22', maidens: 4, runs: 63, wickets: 2 },
				{ name: 'Felix Organ', overs: '17', maidens: 3, runs: 65, wickets: 1 }
			],
			fow: [
				{ wicket: 1, runs: 41, name: 'Hughes', overs: '13.2' },
				{ wicket: 2, runs: 98, name: 'Alsop', overs: '32.5' },
				{ wicket: 3, runs: 148, name: 'Haines', overs: '46.1' },
				{ wicket: 4, runs: 176, name: 'Coles', overs: '54.3' },
				{ wicket: 5, runs: 199, name: 'Simpson', overs: '61.0' },
				{ wicket: 6, runs: 211, name: 'Hudson-Prentice', overs: '64.4' },
				{ wicket: 7, runs: 219, name: 'Carson', overs: '67.1' },
				{ wicket: 8, runs: 225, name: 'Robinson', overs: '69.2' },
				{ wicket: 9, runs: 228, name: 'Crocombe', overs: '70.5' },
				{ wicket: 10, runs: 230, name: 'Hunt', overs: '71.4' }
			]
		});

		innings({
			id: '2026-cc-ham-sus-i4',
			matchId: '2026-cc-ham-sus',
			number: 4,
			battingTeamId: 'hampshire',
			runs: 151,
			wickets: 3,
			overs: '38.2',
			batting: [
				{
					name: 'Ali Orr',
					runs: 44,
					balls: 61,
					fours: 6,
					dismissal: 'caught',
					bowler: 'Robinson',
					fielder: 'Simpson'
				},
				{
					name: 'Fletcha Middleton',
					runs: 21,
					balls: 34,
					fours: 3,
					dismissal: 'lbw',
					bowler: 'Karvelas'
				},
				{
					name: 'Nick Gubbins',
					runs: 39,
					balls: 58,
					fours: 4,
					dismissal: 'caught',
					bowler: 'Carson',
					fielder: 'Haines'
				},
				{ name: 'James Vince', runs: 38, balls: 52, fours: 5, dismissal: 'not out' },
				{ name: 'Ben Brown', runs: 6, balls: 15, fours: 1, dismissal: 'not out' }
			],
			bowling: [
				{ name: 'Ollie Robinson', overs: '12', maidens: 2, runs: 41, wickets: 1 },
				{ name: 'Ari Karvelas', overs: '10', maidens: 1, runs: 38, wickets: 1 },
				{ name: 'Jack Carson', overs: '11.2', maidens: 1, runs: 44, wickets: 1 },
				{ name: 'Sean Hunt', overs: '5', maidens: 0, runs: 25, wickets: 0 }
			],
			fow: [
				{ wicket: 1, runs: 48, name: 'Middleton', overs: '12.4' },
				{ wicket: 2, runs: 91, name: 'Orr', overs: '23.1' },
				{ wicket: 3, runs: 132, name: 'Gubbins', overs: '33.5' }
			]
		});

		insertMatch.run({
			id: '2026-cc-dur-lan',
			competitionId: 'championship',
			groupId: 'division-two',
			season: appConfig.season,
			homeTeamId: 'durham',
			awayTeamId: 'lancashire',
			venue: 'Chester-le-Street',
			startAt: '2026-09-17T10:00:00.000Z',
			endAt: null,
			status: 'upcoming',
			format: 'first-class',
			dayNumber: null,
			session: null,
			resultText: null,
			followOn: 0,
			targetRuns: null,
			targetBalls: null,
			tossWinnerId: null,
			tossDecision: null,
			updatedAt: now
		});

		insertMatch.run({
			id: '2026-bl-som-war',
			competitionId: 'blast',
			groupId: 'group-b',
			season: appConfig.season,
			homeTeamId: 'somerset',
			awayTeamId: 'warwickshire',
			venue: 'Taunton',
			startAt: '2026-09-09T17:30:00.000Z',
			endAt: '2026-09-09T20:18:00.000Z',
			status: 'completed',
			format: 't20',
			dayNumber: null,
			session: null,
			resultText: 'Somerset won by 22 runs',
			followOn: 0,
			targetRuns: 187,
			targetBalls: 120,
			tossWinnerId: 'warwickshire',
			tossDecision: 'bowl',
			updatedAt: now
		});

		innings({
			id: '2026-bl-som-war-i1',
			matchId: '2026-bl-som-war',
			number: 1,
			battingTeamId: 'somerset',
			runs: 186,
			wickets: 7,
			overs: '20.0',
			extras: { wides: 7, legByes: 5 },
			batting: [
				{
					name: 'Tom Banton',
					runs: 62,
					balls: 38,
					fours: 6,
					sixes: 3,
					dismissal: 'caught',
					bowler: 'Hasan Ali',
					fielder: 'Davies'
				},
				{
					name: 'Will Smeed',
					runs: 41,
					balls: 26,
					fours: 4,
					sixes: 2,
					dismissal: 'caught',
					bowler: 'Briggs',
					fielder: 'Hain'
				},
				{
					name: 'Tom Kohler-Cadmore',
					runs: 28,
					balls: 19,
					fours: 2,
					sixes: 1,
					dismissal: 'bowled',
					bowler: 'Hasan Ali'
				},
				{
					name: 'Tom Abell',
					runs: 18,
					balls: 14,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Yates',
					fielder: 'Malan'
				},
				{
					name: 'Sean Dickson',
					runs: 14,
					balls: 11,
					fours: 1,
					sixes: 1,
					dismissal: 'run out',
					fielder: 'Benjamin'
				},
				{
					name: 'Lewis Gregory',
					runs: 9,
					balls: 7,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Hasan Ali',
					fielder: 'Davies'
				},
				{ name: 'Ben Green', runs: 7, balls: 5, dismissal: 'not out' },
				{ name: 'Craig Overton', runs: 2, balls: 2, dismissal: 'not out' }
			],
			bowling: [
				{ name: 'Hasan Ali', overs: '4', maidens: 0, runs: 32, wickets: 3 },
				{ name: 'Danny Briggs', overs: '4', maidens: 0, runs: 29, wickets: 1 },
				{ name: 'Jake Lintott', overs: '4', maidens: 0, runs: 41, wickets: 0 },
				{ name: 'Rob Yates', overs: '4', maidens: 0, runs: 36, wickets: 1 },
				{ name: 'Craig Miles', overs: '4', maidens: 0, runs: 38, wickets: 0 }
			],
			fow: [
				{ wicket: 1, runs: 88, name: 'Smeed', overs: '9.2' },
				{ wicket: 2, runs: 131, name: 'Banton', overs: '13.4' },
				{ wicket: 3, runs: 148, name: 'Kohler-Cadmore', overs: '15.5' },
				{ wicket: 4, runs: 164, name: 'Abell', overs: '17.3' },
				{ wicket: 5, runs: 171, name: 'Dickson', overs: '18.1' },
				{ wicket: 6, runs: 178, name: 'Gregory', overs: '19.1' }
			]
		});

		innings({
			id: '2026-bl-som-war-i2',
			matchId: '2026-bl-som-war',
			number: 2,
			battingTeamId: 'warwickshire',
			runs: 164,
			wickets: 10,
			overs: '19.2',
			extras: { wides: 6, legByes: 3 },
			batting: [
				{
					name: 'Alex Davies',
					runs: 38,
					balls: 24,
					fours: 5,
					sixes: 1,
					dismissal: 'caught',
					bowler: 'Overton',
					fielder: 'Banton'
				},
				{ name: 'Rob Yates', runs: 22, balls: 18, fours: 3, dismissal: 'lbw', bowler: 'Overton' },
				{
					name: 'Sam Hain',
					runs: 41,
					balls: 29,
					fours: 3,
					sixes: 1,
					dismissal: 'caught',
					bowler: 'Green',
					fielder: 'Abell'
				},
				{
					name: 'Dan Mousley',
					runs: 19,
					balls: 16,
					fours: 1,
					sixes: 1,
					dismissal: 'bowled',
					bowler: 'Meredith'
				},
				{
					name: 'Ed Barnard',
					runs: 17,
					balls: 13,
					fours: 2,
					dismissal: 'caught',
					bowler: 'Green',
					fielder: 'Dickson'
				},
				{
					name: 'Chris Benjamin',
					runs: 9,
					balls: 8,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Meredith',
					fielder: 'Banton'
				},
				{ name: 'Danny Briggs', runs: 6, balls: 5, dismissal: 'run out', fielder: 'Gregory' },
				{
					name: 'Hasan Ali',
					runs: 4,
					balls: 4,
					dismissal: 'caught',
					bowler: 'Overton',
					fielder: 'Smeed'
				},
				{ name: 'Jake Lintott', runs: 2, balls: 3, dismissal: 'lbw', bowler: 'Green' },
				{ name: 'Craig Miles', runs: 1, balls: 2, dismissal: 'not out' },
				{ name: 'Olly Hannon-Dalby', runs: 0, balls: 1, dismissal: 'bowled', bowler: 'Meredith' }
			],
			bowling: [
				{ name: 'Craig Overton', overs: '4', maidens: 0, runs: 28, wickets: 3 },
				{ name: 'Riley Meredith', overs: '3.2', maidens: 0, runs: 31, wickets: 2 },
				{ name: 'Ben Green', overs: '4', maidens: 0, runs: 33, wickets: 3 },
				{ name: 'Lewis Gregory', overs: '4', maidens: 0, runs: 35, wickets: 0 },
				{ name: 'Lewis Goldsworthy', overs: '4', maidens: 0, runs: 31, wickets: 0 }
			],
			fow: [
				{ wicket: 1, runs: 51, name: 'Yates', overs: '5.4' },
				{ wicket: 2, runs: 78, name: 'Davies', overs: '8.2' },
				{ wicket: 3, runs: 118, name: 'Mousley', overs: '13.1' },
				{ wicket: 4, runs: 141, name: 'Hain', overs: '16.0' },
				{ wicket: 5, runs: 151, name: 'Barnard', overs: '17.1' },
				{ wicket: 6, runs: 156, name: 'Benjamin', overs: '17.5' },
				{ wicket: 7, runs: 159, name: 'Briggs', overs: '18.2' },
				{ wicket: 8, runs: 161, name: 'Hasan Ali', overs: '18.5' },
				{ wicket: 9, runs: 163, name: 'Lintott', overs: '18.6' },
				{ wicket: 10, runs: 164, name: 'Miles', overs: '19.2' }
			]
		});

		insertMatch.run({
			id: '2026-bl-ess-sur',
			competitionId: 'blast',
			groupId: 'group-c',
			season: appConfig.season,
			homeTeamId: 'essex',
			awayTeamId: 'surrey',
			venue: 'Chelmsford',
			startAt: '2026-09-12T17:30:00.000Z',
			endAt: null,
			status: 'upcoming',
			format: 't20',
			dayNumber: null,
			session: null,
			resultText: null,
			followOn: 0,
			targetRuns: null,
			targetBalls: null,
			tossWinnerId: null,
			tossDecision: null,
			updatedAt: now
		});

		insertMatch.run({
			id: '2026-odc-yor-ham',
			competitionId: 'one-day-cup',
			groupId: 'group-b',
			season: appConfig.season,
			homeTeamId: 'yorkshire',
			awayTeamId: 'hampshire',
			venue: 'Scarborough',
			startAt: '2026-09-13T10:00:00.000Z',
			endAt: null,
			status: 'upcoming',
			format: 'lista',
			dayNumber: null,
			session: null,
			resultText: null,
			followOn: 0,
			targetRuns: null,
			targetBalls: null,
			tossWinnerId: null,
			tossDecision: null,
			updatedAt: now
		});

		insertMatch.run({
			id: '2026-odc-lei-lan',
			competitionId: 'one-day-cup',
			groupId: 'group-a',
			season: appConfig.season,
			homeTeamId: 'leicestershire',
			awayTeamId: 'lancashire',
			venue: 'Grace Road',
			startAt: '2026-09-08T10:00:00.000Z',
			endAt: '2026-09-08T17:12:00.000Z',
			status: 'completed',
			format: 'lista',
			dayNumber: null,
			session: null,
			resultText: 'Leicestershire won by 4 wickets',
			followOn: 0,
			targetRuns: 248,
			targetBalls: 300,
			tossWinnerId: 'leicestershire',
			tossDecision: 'bowl',
			updatedAt: now
		});

		innings({
			id: '2026-odc-lei-lan-i1',
			matchId: '2026-odc-lei-lan',
			number: 1,
			battingTeamId: 'lancashire',
			runs: 247,
			wickets: 8,
			overs: '50.0',
			extras: { wides: 8, legByes: 6, noBalls: 1 },
			batting: [
				{
					name: 'Keaton Jennings',
					runs: 68,
					balls: 81,
					fours: 7,
					dismissal: 'caught',
					bowler: 'Scriven',
					fielder: 'Handscomb'
				},
				{ name: 'Luke Wells', runs: 22, balls: 31, fours: 3, dismissal: 'lbw', bowler: 'Hull' },
				{
					name: 'Josh Bohannon',
					runs: 41,
					balls: 52,
					fours: 4,
					dismissal: 'caught',
					bowler: 'Salisbury',
					fielder: 'Hill'
				},
				{
					name: 'George Bell',
					runs: 33,
					balls: 38,
					fours: 3,
					dismissal: 'caught',
					bowler: 'Scriven',
					fielder: 'Cox'
				},
				{
					name: 'George Balderson',
					runs: 29,
					balls: 34,
					fours: 2,
					dismissal: 'caught',
					bowler: 'Hull',
					fielder: 'Ahmed'
				},
				{
					name: 'Matty Hurst',
					runs: 19,
					balls: 22,
					fours: 1,
					dismissal: 'run out',
					fielder: 'Cox'
				},
				{ name: 'Tom Hartley', runs: 14, balls: 16, fours: 1, dismissal: 'not out' },
				{
					name: 'Tom Bailey',
					runs: 8,
					balls: 9,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Salisbury',
					fielder: 'Hill'
				},
				{ name: 'Will Williams', runs: 5, balls: 7, dismissal: 'not out' }
			],
			bowling: [
				{ name: 'Josh Hull', overs: '10', maidens: 1, runs: 44, wickets: 2 },
				{ name: 'Matt Salisbury', overs: '10', maidens: 0, runs: 51, wickets: 2 },
				{ name: 'Tom Scriven', overs: '10', maidens: 0, runs: 48, wickets: 2 },
				{ name: 'Rehan Ahmed', overs: '10', maidens: 0, runs: 49, wickets: 0 },
				{ name: 'Liam Trevaskis', overs: '10', maidens: 0, runs: 43, wickets: 0 }
			],
			fow: [
				{ wicket: 1, runs: 41, name: 'Wells', overs: '9.4' },
				{ wicket: 2, runs: 112, name: 'Bohannon', overs: '24.2' },
				{ wicket: 3, runs: 158, name: 'Jennings', overs: '33.1' },
				{ wicket: 4, runs: 186, name: 'Bell', overs: '38.4' },
				{ wicket: 5, runs: 214, name: 'Balderson', overs: '43.5' },
				{ wicket: 6, runs: 226, name: 'Hurst', overs: '46.1' },
				{ wicket: 7, runs: 236, name: 'Bailey', overs: '48.0' }
			]
		});

		innings({
			id: '2026-odc-lei-lan-i2',
			matchId: '2026-odc-lei-lan',
			number: 2,
			battingTeamId: 'leicestershire',
			runs: 248,
			wickets: 6,
			overs: '48.3',
			extras: { wides: 7, legByes: 4 },
			batting: [
				{
					name: 'Sol Budinger',
					runs: 31,
					balls: 28,
					fours: 5,
					dismissal: 'caught',
					bowler: 'Bailey',
					fielder: 'Hurst'
				},
				{
					name: 'Rishi Patel',
					runs: 54,
					balls: 62,
					fours: 6,
					dismissal: 'caught',
					bowler: 'Hartley',
					fielder: 'Jennings'
				},
				{ name: 'Lewis Hill', runs: 22, balls: 31, fours: 2, dismissal: 'lbw', bowler: 'Wells' },
				{
					name: 'Peter Handscomb',
					runs: 61,
					balls: 71,
					fours: 5,
					dismissal: 'caught',
					bowler: 'Williams',
					fielder: 'Bell'
				},
				{
					name: 'Louis Kimber',
					runs: 18,
					balls: 22,
					fours: 1,
					dismissal: 'bowled',
					bowler: 'Hartley'
				},
				{ name: 'Ben Cox', runs: 27, balls: 29, fours: 2, dismissal: 'not out' },
				{
					name: 'Rehan Ahmed',
					runs: 19,
					balls: 24,
					fours: 1,
					dismissal: 'caught',
					bowler: 'Bailey',
					fielder: 'Bohannon'
				},
				{ name: 'Tom Scriven', runs: 5, balls: 8, fours: 0, dismissal: 'not out' }
			],
			bowling: [
				{ name: 'Tom Bailey', overs: '9.3', maidens: 0, runs: 48, wickets: 2 },
				{ name: 'Will Williams', overs: '10', maidens: 0, runs: 51, wickets: 1 },
				{ name: 'Tom Hartley', overs: '10', maidens: 0, runs: 46, wickets: 2 },
				{ name: 'Luke Wells', overs: '10', maidens: 0, runs: 49, wickets: 1 },
				{ name: 'George Balderson', overs: '9', maidens: 0, runs: 43, wickets: 0 }
			],
			fow: [
				{ wicket: 1, runs: 48, name: 'Budinger', overs: '8.1' },
				{ wicket: 2, runs: 86, name: 'Hill', overs: '16.4' },
				{ wicket: 3, runs: 141, name: 'Patel', overs: '28.2' },
				{ wicket: 4, runs: 172, name: 'Kimber', overs: '34.5' },
				{ wicket: 5, runs: 214, name: 'Handscomb', overs: '42.3' },
				{ wicket: 6, runs: 236, name: 'Ahmed', overs: '46.4' }
			]
		});

		const standings: Standing[] = [
			s('championship', 'division-one', 'nottinghamshire', 6, 2, 0, 91, {
				drawn: 4,
				bat: 18,
				bowl: 17
			}),
			s('championship', 'division-one', 'surrey', 7, 1, 1, 89, { drawn: 5, bat: 21, bowl: 18 }),
			s('championship', 'division-one', 'warwickshire', 6, 2, 1, 86, {
				drawn: 3,
				bat: 16,
				bowl: 18
			}),
			s('championship', 'division-one', 'glamorgan', 6, 2, 1, 83, { drawn: 3, bat: 15, bowl: 17 }),
			s('championship', 'division-one', 'essex', 6, 3, 2, 80, { drawn: 1, bat: 14, bowl: 16 }),
			s('championship', 'division-one', 'sussex', 6, 3, 1, 79, {
				drawn: 2,
				bat: 15,
				bowl: 16,
				deducted: 12
			}),
			s('championship', 'division-one', 'somerset', 6, 2, 2, 79, { drawn: 2, bat: 17, bowl: 18 }),
			s('championship', 'division-one', 'yorkshire', 6, 2, 2, 71, { drawn: 2, bat: 14, bowl: 17 }),
			s('championship', 'division-one', 'hampshire', 7, 1, 4, 53, { drawn: 2, bat: 12, bowl: 17 }),
			s('championship', 'division-one', 'leicestershire', 6, 0, 4, 46, {
				drawn: 2,
				bat: 11,
				bowl: 15
			}),
			s('championship', 'division-two', 'durham', 6, 4, 0, 118, { drawn: 2, bat: 16, bowl: 18 }),
			s('championship', 'division-two', 'kent', 6, 3, 1, 97, { drawn: 2, bat: 15, bowl: 16 }),
			s('championship', 'division-two', 'northamptonshire', 6, 3, 1, 96, {
				drawn: 2,
				bat: 14,
				bowl: 17
			}),
			s('championship', 'division-two', 'worcestershire', 6, 2, 2, 81, {
				drawn: 2,
				bat: 13,
				bowl: 16
			}),
			s('championship', 'division-two', 'middlesex', 6, 2, 3, 74, { drawn: 1, bat: 14, bowl: 16 }),
			s('championship', 'division-two', 'derbyshire', 6, 2, 3, 71, { drawn: 1, bat: 12, bowl: 15 }),
			s('championship', 'division-two', 'lancashire', 6, 1, 3, 62, { drawn: 2, bat: 12, bowl: 16 }),
			s('championship', 'division-two', 'gloucestershire', 6, 0, 5, 31, {
				drawn: 1,
				bat: 9,
				bowl: 14
			}),
			s('blast', 'group-a', 'nottinghamshire', 8, 6, 2, 24, { nrr: 0.84 }),
			s('blast', 'group-a', 'yorkshire', 8, 5, 3, 20, { nrr: 0.41 }),
			s('blast', 'group-a', 'lancashire', 8, 5, 3, 20, { nrr: 0.22 }),
			s('blast', 'group-a', 'durham', 8, 4, 4, 16, { nrr: 0.05 }),
			s('blast', 'group-a', 'leicestershire', 8, 3, 5, 12, { nrr: -0.31 }),
			s('blast', 'group-a', 'derbyshire', 8, 1, 7, 4, { nrr: -1.12 }),
			s('blast', 'group-b', 'somerset', 8, 6, 2, 24, { nrr: 0.91 }),
			s('blast', 'group-b', 'warwickshire', 8, 5, 3, 20, { nrr: 0.38 }),
			s('blast', 'group-b', 'worcestershire', 8, 4, 4, 16, { nrr: 0.11 }),
			s('blast', 'group-b', 'glamorgan', 8, 4, 4, 16, { nrr: -0.04 }),
			s('blast', 'group-b', 'northamptonshire', 8, 3, 4, 12, { nrr: -0.22, noResult: 1 }),
			s('blast', 'group-b', 'gloucestershire', 8, 2, 6, 8, { nrr: -0.88 }),
			s('blast', 'group-c', 'surrey', 8, 6, 2, 24, { nrr: 1.05 }),
			s('blast', 'group-c', 'sussex', 8, 5, 3, 20, { nrr: 0.44 }),
			s('blast', 'group-c', 'essex', 8, 4, 4, 16, { nrr: 0.18 }),
			s('blast', 'group-c', 'hampshire', 8, 4, 4, 16, { nrr: -0.09 }),
			s('blast', 'group-c', 'kent', 8, 3, 5, 12, { nrr: -0.51 }),
			s('blast', 'group-c', 'middlesex', 8, 2, 6, 8, { nrr: -1.21 }),
			s('one-day-cup', 'group-a', 'leicestershire', 8, 5, 3, 10, { nrr: 0.517 }),
			s('one-day-cup', 'group-a', 'lancashire', 8, 5, 3, 10, { nrr: 0.406 }),
			s('one-day-cup', 'group-a', 'nottinghamshire', 8, 5, 3, 10, { nrr: 0.177 }),
			s('one-day-cup', 'group-a', 'warwickshire', 8, 4, 4, 8, { nrr: 0.078 }),
			s('one-day-cup', 'group-a', 'surrey', 8, 4, 4, 8, { nrr: -0.238 }),
			s('one-day-cup', 'group-a', 'kent', 8, 4, 4, 8, { nrr: -0.607 }),
			s('one-day-cup', 'group-a', 'northamptonshire', 8, 3, 5, 6, { nrr: 0.127 }),
			s('one-day-cup', 'group-a', 'gloucestershire', 8, 3, 5, 6, { nrr: -0.096 }),
			s('one-day-cup', 'group-a', 'somerset', 8, 3, 5, 6, { nrr: -0.383 }),
			s('one-day-cup', 'group-b', 'middlesex', 8, 7, 1, 14, { nrr: 1.659 }),
			s('one-day-cup', 'group-b', 'yorkshire', 8, 6, 2, 12, { nrr: 0.778 }),
			s('one-day-cup', 'group-b', 'durham', 8, 5, 3, 10, { nrr: 0.089 }),
			s('one-day-cup', 'group-b', 'worcestershire', 8, 5, 3, 10, { nrr: 0.032 }),
			s('one-day-cup', 'group-b', 'hampshire', 8, 4, 4, 8, { nrr: -0.083 }),
			s('one-day-cup', 'group-b', 'derbyshire', 8, 3, 5, 6, { nrr: 0.156 }),
			s('one-day-cup', 'group-b', 'essex', 8, 3, 5, 6, { nrr: -0.203 }),
			s('one-day-cup', 'group-b', 'glamorgan', 8, 2, 6, 4, { nrr: -0.93 }),
			s('one-day-cup', 'group-b', 'sussex', 8, 1, 7, 2, { nrr: -1.517 })
		];

		for (const row of standings) {
			insertStanding.run({
				competitionId: row.competitionId,
				groupId: row.groupId,
				season: appConfig.season,
				teamId: row.teamId,
				played: row.played,
				won: row.won,
				lost: row.lost,
				drawn: row.drawn ?? 0,
				tied: row.tied ?? 0,
				noResult: row.noResult ?? 0,
				battingBonus: row.battingBonus ?? 0,
				bowlingBonus: row.bowlingBonus ?? 0,
				points: row.points,
				deducted: row.deducted ?? 0,
				nrr: row.nrr ?? null,
				updatedAt: now
			});
		}

		insertMeta.run('source', 'seed');
		insertMeta.run('updated_at', now);
		insertMeta.run('seeded_at', now);
	});

	tx();
}

function s(
	competitionId: string,
	groupId: string,
	teamId: string,
	played: number,
	won: number,
	lost: number,
	points: number,
	extra: {
		drawn?: number;
		tied?: number;
		noResult?: number;
		bat?: number;
		bowl?: number;
		deducted?: number;
		nrr?: number;
	} = {}
): Standing {
	return {
		competitionId,
		groupId,
		teamId,
		played,
		won,
		lost,
		drawn: extra.drawn ?? 0,
		tied: extra.tied ?? 0,
		noResult: extra.noResult ?? 0,
		battingBonus: extra.bat ?? 0,
		bowlingBonus: extra.bowl ?? 0,
		points,
		deducted: extra.deducted ?? 0,
		nrr: extra.nrr ?? null
	};
}
