import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ESPN_ROBOTS_URL, CRICINFO_ROBOTS_URL, ESPN_SITE_API } from '../src/lib/providers/http.js';
import type { HttpGet } from '../src/lib/providers/types.js';

const ALLOW_ROBOTS = 'User-agent: *\nAllow: /\n';
const ESPN_ROBOTS = 'User-agent: *\nDisallow: */boxscore?\n';

function scoreboard(id: string, state: string, home: string, away: string, live = false) {
	return {
		events: [
			{
				id,
				date: '2026-09-08T09:30Z',
				competitions: [
					{
						venue: { fullName: 'Trent Bridge' },
						status: {
							summary: live ? 'Day 2' : 'Match drawn',
							type: { state },
							period: live ? 2 : 4
						},
						competitors: [
							{
								homeAway: 'home',
								team: { abbreviation: home, name: home === 'NOT' ? 'Nottinghamshire' : 'Sussex' },
								linescores: [
									{
										period: 1,
										isBatting: true,
										runs: 200,
										wickets: 3,
										overs: 50,
										description: live ? '' : 'all out'
									}
								]
							},
							{
								homeAway: 'away',
								team: { abbreviation: away, name: away === 'SUR' ? 'Surrey' : 'Yorkshire' },
								linescores: []
							}
						]
					}
				]
			}
		]
	};
}

function standings() {
	return {
		children: [
			{
				name: '',
				standings: {
					entries: [
						{
							team: { abbreviation: 'SOM', name: 'Somerset' },
							stats: [
								{ name: 'matchesPlayed', value: 12 },
								{ name: 'matchesWon', value: 6 },
								{ name: 'matchesLost', value: 2 },
								{ name: 'matchesDraw', value: 4 },
								{ name: 'matchPoints', value: 189 }
							]
						}
					]
				}
			}
		]
	};
}

function mockGet(overrides: Record<string, { status: number; body: unknown }> = {}): HttpGet {
	return async (url: string) => {
		if (url === ESPN_ROBOTS_URL) {
			return { status: 200, body: ESPN_ROBOTS, url };
		}
		if (url === CRICINFO_ROBOTS_URL) {
			return { status: 200, body: ALLOW_ROBOTS, url };
		}
		for (const [fragment, payload] of Object.entries(overrides)) {
			if (url.includes(fragment)) {
				const body = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
				return { status: payload.status, body, url };
			}
		}
		if (url.includes('/8052/scoreboard')) {
			return {
				status: 200,
				body: JSON.stringify(scoreboard('1513384', 'post', 'SUS', 'SUR')),
				url
			};
		}
		if (url.includes('/8204/scoreboard')) {
			return { status: 200, body: JSON.stringify({ events: [] }), url };
		}
		if (url.includes('/8053/scoreboard') || url.includes('/8335/scoreboard')) {
			return { status: 200, body: JSON.stringify({ events: [] }), url };
		}
		if (url.includes('/8052/standings')) {
			return { status: 200, body: JSON.stringify(standings()), url };
		}
		if (url.includes('/standings')) {
			return { status: 200, body: JSON.stringify({ children: [] }), url };
		}
		if (url.includes('/summary')) {
			return { status: 200, body: JSON.stringify({ header: {}, rosters: [], notes: [] }), url };
		}
		return { status: 404, body: '{}', url };
	};
}

describe('ingest', () => {
	beforeEach(() => {
		process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), 'ccl-ingest-')), 'test.sqlite');
	});

	afterEach(async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
	});

	it('writes ESPN matches into SQLite and removes seed rows for that competition', async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
		const { runIngest } = await import('../src/lib/ingest/run.js');
		const { getMatch, listStandings, getMeta } = await import('../src/lib/server/queries.js');

		const report = await runIngest({
			get: mockGet(),
			scope: 'all',
			now: new Date('2026-09-12T12:00:00Z')
		});
		expect(report.result).toBe('ok');
		expect(report.network).toBe(true);
		expect(report.matches).toBeGreaterThanOrEqual(1);
		expect(getMatch('1513384')?.homeTeamId).toBe('sussex');
		expect(getMatch('2026-cc-not-sur')).toBeNull();
		expect(
			listStandings('championship', 'division-one').some((row) => row.teamId === 'somerset')
		).toBe(true);
		expect(getMeta('source')).toBe('espncricinfo');
	});

	it('skips and keeps seed when robots cannot be fetched', async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
		const { runIngest } = await import('../src/lib/ingest/run.js');
		const { getMatch, getMeta } = await import('../src/lib/server/queries.js');
		const get: HttpGet = async (url) => ({ status: 403, body: 'denied', url });
		const report = await runIngest({ get, now: new Date('2026-09-12T12:00:00Z') });
		expect(report.result).toBe('skipped');
		expect(getMatch('2026-cc-not-sur')?.status).toBe('live');
		expect(getMeta('source')).toBe('seed');
	});

	it('skips a 403 scoreboard and leaves seed for that series', async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
		const { runIngest } = await import('../src/lib/ingest/run.js');
		const { getMatch } = await import('../src/lib/server/queries.js');
		const get = mockGet({
			[`${ESPN_SITE_API}/apis/site/v2/sports/cricket/8052/scoreboard`]: {
				status: 403,
				body: 'nope'
			}
		});
		const report = await runIngest({ get, now: new Date('2026-09-12T12:00:00Z') });
		expect(report.skippedSeries.some((item) => item.leagueId === '8052')).toBe(true);
		expect(getMatch('2026-cc-not-sur')?.status).toBe('live');
	});
});
