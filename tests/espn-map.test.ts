import { describe, expect, it } from 'vitest';
import {
	countyIdFromEspnTeam,
	formatOversValue,
	mapMatchStatus,
	parseScoreboardEvents,
	parseStandingsPayload,
	applySummaryToMatch
} from '../src/lib/ingest/espn-map.js';
import { appConfig } from '../src/lib/config/index.js';
import {
	evaluateIngestRobots,
	isPathAllowed,
	parseRobotsTxt
} from '../src/lib/providers/robots.js';

const series = appConfig.series.championshipDivisionOne;

describe('espn mapping', () => {
	it('maps county abbreviations and overs', () => {
		expect(countyIdFromEspnTeam({ abbreviation: 'NOT', name: 'Nottinghamshire' })).toBe(
			'nottinghamshire'
		);
		expect(countyIdFromEspnTeam({ abbreviation: 'MCC' })).toBeNull();
		expect(formatOversValue(104)).toBe('104.0');
		expect(formatOversValue(104.4)).toBe('104.4');
		expect(mapMatchStatus('in', 'Day 2')).toBe('live');
		expect(mapMatchStatus('post', 'Match abandoned')).toBe('abandoned');
		expect(mapMatchStatus('post', 'Match drawn')).toBe('completed');
	});

	it('parses a Championship scoreboard event into innings totals', () => {
		const payload = {
			events: [
				{
					id: '1513384',
					date: '2026-09-08T09:30Z',
					endDate: '2026-09-12T23:59Z',
					competitions: [
						{
							venue: { fullName: 'County Ground, Hove' },
							status: { summary: 'Match drawn', type: { state: 'post' }, period: 4 },
							competitors: [
								{
									homeAway: 'home',
									team: { abbreviation: 'SUS', name: 'Sussex' },
									linescores: [
										{
											period: 1,
											isBatting: true,
											runs: 393,
											wickets: 10,
											overs: 104,
											description: 'all out',
											statistics: {
												categories: [
													{
														stats: [
															{ name: 'byes', value: '4' },
															{ name: 'legbyes', value: '17' }
														]
													}
												]
											}
										},
										{
											period: 3,
											isBatting: true,
											runs: 167,
											wickets: 3,
											overs: 65,
											description: 'declared'
										}
									]
								},
								{
									homeAway: 'away',
									team: { abbreviation: 'SUR', name: 'Surrey' },
									linescores: [
										{
											period: 2,
											isBatting: true,
											runs: 321,
											wickets: 10,
											overs: 104.4,
											description: 'all out'
										}
									]
								}
							]
						}
					]
				}
			]
		};
		const matches = parseScoreboardEvents(payload, series, 'first-class');
		expect(matches).toHaveLength(1);
		expect(matches[0].homeTeamId).toBe('sussex');
		expect(matches[0].awayTeamId).toBe('surrey');
		expect(matches[0].groupId).toBe('division-one');
		expect(matches[0].status).toBe('completed');
		expect(matches[0].innings.map((innings) => innings.number)).toEqual([1, 2, 3]);
		expect(matches[0].innings[2].declared).toBe(true);
		expect(matches[0].innings[0].byes).toBe(4);
	});

	it('fills batting and bowling from a summary roster', () => {
		const base = parseScoreboardEvents(
			{
				events: [
					{
						id: '1',
						date: '2026-09-08T09:30Z',
						competitions: [
							{
								venue: { fullName: 'Hove' },
								status: { type: { state: 'post' }, summary: 'Match drawn' },
								competitors: [
									{
										homeAway: 'home',
										team: { abbreviation: 'SUS', name: 'Sussex' },
										linescores: [
											{
												period: 1,
												isBatting: true,
												runs: 50,
												wickets: 1,
												overs: 10,
												description: ''
											}
										]
									},
									{
										homeAway: 'away',
										team: { abbreviation: 'SUR', name: 'Surrey' },
										linescores: []
									}
								]
							}
						]
					}
				]
			},
			series,
			'first-class'
		)[0];

		const detailed = applySummaryToMatch(base, {
			header: {
				competitions: [{ status: { summary: 'Match drawn', type: { state: 'post' }, period: 1 } }]
			},
			notes: [{ type: 'toss', text: 'Sussex , elected to bat first' }],
			rosters: [
				{
					team: { abbreviation: 'SUS', name: 'Sussex' },
					roster: [
						{
							athlete: { battingName: 'TJ Haines', displayName: 'Tom Haines' },
							linescores: [
								{
									period: 1,
									linescores: [
										{
											statistics: {
												categories: [
													{
														stats: [
															{ name: 'inningsNumber', value: 1 },
															{ name: 'batted', value: 1 },
															{ name: 'battingPosition', value: 1 },
															{ name: 'runs', value: 63 },
															{ name: 'ballsFaced', value: 128 },
															{ name: 'fours', value: 5 },
															{ name: 'sixes', value: 0 },
															{ name: 'dismissalCard', value: 'c' },
															{ name: 'notouts', value: 0 }
														]
													}
												],
												batting: {
													active: false,
													outDetails: {
														bowler: { displayName: 'Daniel Worrall' },
														fielders: [{ athlete: { displayName: 'Dom Sibley' } }]
													}
												}
											}
										}
									]
								}
							]
						}
					]
				},
				{
					team: { abbreviation: 'SUR', name: 'Surrey' },
					roster: [
						{
							athlete: { battingName: 'DJ Worrall', displayName: 'Daniel Worrall' },
							linescores: [
								{
									period: 1,
									linescores: [
										{
											statistics: {
												categories: [
													{
														stats: [
															{ name: 'inningsNumber', value: 1 },
															{ name: 'inningsBowled', value: 1 },
															{ name: 'bowlingPosition', value: 1 },
															{ name: 'overs', value: 21 },
															{ name: 'maidens', value: 3 },
															{ name: 'conceded', value: 60 },
															{ name: 'wickets', value: 2 }
														]
													}
												]
											}
										}
									]
								}
							]
						}
					]
				}
			]
		});
		expect(detailed.tossWinnerId).toBe('sussex');
		expect(detailed.tossDecision).toBe('bat');
		expect(detailed.hasScorecard).toBe(true);
		expect(detailed.innings[0].batting[0]).toMatchObject({
			playerName: 'TJ Haines',
			runs: 63,
			dismissal: 'caught',
			dismissedBy: 'Daniel Worrall',
			fielder: 'Dom Sibley'
		});
		expect(detailed.innings[0].bowling[0]).toMatchObject({
			playerName: 'DJ Worrall',
			wickets: 2,
			overs: '21.0'
		});
	});

	it('maps Blast standings into config groups and skips Cross Pool', () => {
		const payload = {
			children: [
				{
					name: 'Cross Pool',
					standings: {
						entries: Array.from({ length: 18 }, (_, index) => ({
							team: { abbreviation: index === 0 ? 'YOR' : 'SUR', name: 'Yorkshire' },
							stats: [{ name: 'matchPoints', value: 1 }]
						}))
					}
				},
				{
					name: 'North Group',
					standings: {
						entries: [
							{
								team: { abbreviation: 'YOR', name: 'Yorkshire' },
								stats: [
									{ name: 'matchesPlayed', value: 10 },
									{ name: 'matchesWon', value: 8 },
									{ name: 'matchesLost', value: 2 },
									{ name: 'matchPoints', value: 16 },
									{ name: 'netrr', value: 0.42 }
								]
							}
						]
					}
				}
			]
		};
		const rows = parseStandingsPayload(payload, appConfig.series.blast);
		expect(rows).toHaveLength(1);
		expect(rows[0].groupId).toBe('group-a');
		expect(rows[0].teamId).toBe('yorkshire');
		expect(rows[0].points).toBe(16);
		expect(rows[0].netRunRate).toBe(0.42);
	});
});

describe('robots', () => {
	it('allows ESPN scoreboard paths for generic agents', () => {
		const robots = parseRobotsTxt(`User-agent: *\nDisallow: */boxscore?\nAllow: /\n`);
		expect(
			isPathAllowed(robots, 'CountyCricketLive/0.1', '/apis/site/v2/sports/cricket/scoreboard')
		).toBe(true);
	});

	it('skips ingest when no robots files can be fetched', () => {
		const check = evaluateIngestRobots({
			espnRobots: null,
			cricinfoRobots: null,
			userAgent: 'CountyCricketLive/0.1'
		});
		expect(check.ok).toBe(false);
	});

	it('allows ingest when ESPN robots are readable', () => {
		const check = evaluateIngestRobots({
			espnRobots: 'User-agent: *\nDisallow: */boxscore?\n',
			cricinfoRobots: 'User-agent: *\nAllow: /*\n',
			userAgent: 'CountyCricketLive/0.1'
		});
		expect(check.ok).toBe(true);
		expect(check.cricinfoHtmlAllowed).toBe(true);
	});
});
