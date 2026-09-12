import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decideCadence, matchCoversLondonDate } from '../src/lib/ingest/cadence.js';
import { classifyFreshness } from '../src/lib/ingest/freshness.js';
import { urlAllowed } from '../src/lib/ingest/http.js';
import { isPathAllowed, parseRobotsTxt, robotsHostApplies } from '../src/lib/ingest/robots.js';
import { runIngest } from '../src/lib/ingest/run.js';
import { fuzzyMatchExisting, matchKey } from '../src/lib/providers/fuzzy.js';

function fixture(path: string): string {
	return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('robots', () => {
	it('allows ESPN JSON paths under User-agent * Allow: /*', () => {
		const rules = parseRobotsTxt(`User-agent: *\nAllow: /*\nDisallow: /cgi-bin/\n`);
		expect(
			isPathAllowed(rules, '/apis/site/v2/sports/cricket/8052/scoreboard', 'CountyCricketLive/0.1')
		).toBe(true);
		expect(isPathAllowed(rules, '/cgi-bin/foo', 'CountyCricketLive/0.1')).toBe(false);
	});

	it('applies robots.txt only to that host and subdomains', () => {
		expect(robotsHostApplies('site.web.api.espn.com', 'www.espn.com')).toBe(true);
		expect(robotsHostApplies('static.espncricinfo.com', 'espncricinfo.com')).toBe(true);
		expect(robotsHostApplies('static.espncricinfo.com', 'espn.com')).toBe(false);
		const espn = {
			sourceUrl: 'https://www.espn.com/robots.txt',
			host: 'www.espn.com',
			rules: parseRobotsTxt('User-agent: *\nDisallow: /rss/\n')
		};
		const cricinfo = {
			sourceUrl: 'https://espncricinfo.com/robots.txt',
			host: 'espncricinfo.com',
			rules: parseRobotsTxt('User-agent: *\nAllow: /*\n')
		};
		expect(
			urlAllowed('https://static.espncricinfo.com/rss/livescores.xml', [espn, cricinfo], 'bot')
		).toBe(true);
		expect(urlAllowed('https://site.web.api.espn.com/rss/foo', [espn], 'bot')).toBe(false);
	});
});

describe('cadence', () => {
	it('skips live scorecard fetches when nothing is live', () => {
		const decision = decideCadence({
			liveCount: 0,
			matchDay: false,
			lastLiveAt: null,
			lastFixturesAt: new Date().toISOString(),
			lastStandingsAt: new Date().toISOString(),
			full: false
		});
		expect(decision.fetchLive).toBe(false);
	});

	it('polls live matches and uses the match-day fixture interval', () => {
		const decision = decideCadence({
			liveCount: 2,
			matchDay: true,
			lastLiveAt: new Date(Date.now() - 60_000).toISOString(),
			lastFixturesAt: new Date(Date.now() - 400_000).toISOString(),
			lastStandingsAt: new Date(Date.now() - 1000).toISOString(),
			full: false
		});
		expect(decision.fetchLive).toBe(true);
		expect(decision.fetchFixtures).toBe(true);
		expect(decision.fetchStandings).toBe(false);
	});

	it('treats first-class matches without end_at as four London days', () => {
		expect(
			matchCoversLondonDate('2026-09-10T10:00:00.000Z', null, 'first-class', '2026-09-12')
		).toBe(true);
		expect(matchCoversLondonDate('2026-09-11T17:30:00.000Z', null, 't20', '2026-09-12')).toBe(
			false
		);
	});
});

describe('freshness', () => {
	it('stays on seed when ingest is off even if updated_at is old', () => {
		const classified = classifyFreshness({
			ingestEnabled: false,
			source: 'seed',
			updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
			liveCount: 2
		});
		expect(classified.status).toBe('seed');
	});

	it('marks delayed after 3 minutes and unavailable after 15 when live', () => {
		const delayed = classifyFreshness({
			ingestEnabled: true,
			source: 'espncricinfo',
			updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
			liveCount: 1
		});
		const down = classifyFreshness({
			ingestEnabled: true,
			source: 'espncricinfo',
			updatedAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
			liveCount: 1
		});
		expect(delayed.status).toBe('delayed');
		expect(down.status).toBe('unavailable');
	});

	it('treats an enabled ingest as live freshness even while meta.source is still seed', () => {
		const classified = classifyFreshness({
			ingestEnabled: true,
			source: 'seed',
			updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
			liveCount: 1
		});
		expect(classified.status).toBe('delayed');
	});
});

describe('fuzzy keys', () => {
	it('matches the same two teams on the same London date', () => {
		expect(matchKey('championship', 'sussex', 'surrey', '2026-09-08T09:30:00.000Z')).toBe(
			matchKey('championship', 'surrey', 'sussex', '2026-09-08T10:00:00.000Z')
		);
		const id = fuzzyMatchExisting(
			{
				competitionId: 'championship',
				homeTeamId: 'sussex',
				awayTeamId: 'surrey',
				startAt: '2026-09-08T09:30:00.000Z',
				externalId: '1513384'
			},
			[
				{
					id: 'seed-1',
					sourceKey: null,
					competitionId: 'championship',
					homeTeamId: 'surrey',
					awayTeamId: 'sussex',
					startAt: '2026-09-08T09:30:00.000Z'
				}
			]
		);
		expect(id).toBe('seed-1');
	});
});

describe('enabled ingest with mocked ESPN JSON', () => {
	const previousIngest = process.env.INGESTION_ENABLED;

	beforeEach(() => {
		process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), 'ccl-ingest-')), 'test.sqlite');
		process.env.INGESTION_ENABLED = 'true';
	});

	afterEach(async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
		if (previousIngest === undefined) delete process.env.INGESTION_ENABLED;
		else process.env.INGESTION_ENABLED = previousIngest;
	});

	it('upserts the scoreboard, fetches a live summary, and keeps last-good innings on parse failure', async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
		const liveBoard = fixture('./fixtures/espn/scoreboard-live.json');
		const rss = fixture('./fixtures/rss/livescores.xml');
		const emptyBoard = JSON.stringify({
			leagues: [{ id: 'x', calendar: [] }],
			events: []
		});
		const emptyStandings = JSON.stringify({ children: [] });
		const urls: string[] = [];
		const fetchImpl: typeof fetch = async (input) => {
			const url = String(input);
			urls.push(url);
			if (url.includes('robots.txt')) {
				return new Response('User-agent: *\nAllow: /\n', { status: 200 });
			}
			if (url.includes('/8052/scoreboard') && !url.includes('dates=')) {
				return new Response(liveBoard, { status: 200 });
			}
			if (url.includes('/scoreboard')) {
				return new Response(emptyBoard, { status: 200 });
			}
			if (url.includes('/summary')) {
				return new Response('{"rosters":[],"matchcards":[]}', { status: 200 });
			}
			if (url.includes('/standings')) {
				return new Response(emptyStandings, { status: 200 });
			}
			if (url.includes('livescores.xml')) {
				return new Response(rss, { status: 200 });
			}
			return new Response('missing', { status: 404 });
		};

		const report = await runIngest({ fetchImpl });
		expect(report.network).toBe(true);
		expect(report.result).toBe('ok');
		expect(report.matchesUpserted).toBeGreaterThan(0);
		expect(urls.some((url) => url.includes('/summary'))).toBe(true);

		const { getMatch } = await import('../src/lib/server/queries.js');
		const stored = getMatch('espn-1513384');
		expect(stored).toBeTruthy();
		expect(stored?.stale).toBe(true);
		expect(stored?.innings.length).toBeGreaterThan(0);
		expect(stored?.homeTeamId).toBe('sussex');
	}, 30_000);
});
