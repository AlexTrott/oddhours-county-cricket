import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('seeded database', () => {
	beforeEach(() => {
		process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), 'ccl-')), 'test.sqlite');
	});

	afterEach(async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
	});

	it('seeds live multi-innings, T20, completed, upcoming, and standings', async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
		const { getMatch, healthSnapshot, listMatches, listStandings } =
			await import('../src/lib/server/queries.js');

		const all = listMatches({ order: 'date' });
		expect(all.length).toBeGreaterThan(50);

		const live = listMatches({ status: 'live' });
		expect(live.map((match) => match.id).sort()).toEqual(['2026-bl-yor-not', '2026-cc-not-sur']);

		const championship = getMatch('2026-cc-not-sur');
		expect(championship?.innings).toHaveLength(3);
		expect(championship?.format).toBe('first-class');
		expect(championship?.innings[0].batting.length).toBeGreaterThanOrEqual(11);

		const t20 = getMatch('2026-bl-yor-not');
		expect(t20?.format).toBe('t20');
		expect(t20?.targetRuns).toBe(179);

		const completed = listMatches({ status: 'completed' });
		expect(completed.some((match) => match.resultText)).toBe(true);

		const upcoming = listMatches({ status: 'upcoming' });
		expect(upcoming.length).toBeGreaterThan(0);

		expect(listStandings('championship', 'division-one')).toHaveLength(10);
		expect(listStandings('championship', 'division-one')[0].battingBonus).toBeGreaterThan(0);
		expect(listStandings('championship', 'division-two')).toHaveLength(8);
		expect(listStandings('blast', 'group-a')).toHaveLength(6);
		expect(listStandings('one-day-cup', 'group-b')).toHaveLength(9);

		const knockouts = listMatches({ knockout: true, order: 'date' });
		expect(knockouts.length).toBeGreaterThanOrEqual(8);
		expect(knockouts.some((match) => match.round === 'final')).toBe(true);

		const health = healthSnapshot();
		expect(health.ok).toBe(true);
		expect(health.matches).toBeGreaterThanOrEqual(7);
		expect(health.updated_at).toBeTruthy();
		expect(health.freshness.status).toBe('seed');
		expect(health.ingest_enabled).toBe(false);
		expect(new Date(health.updated_at ?? 0).getTime()).toBeGreaterThan(Date.now() - 60_000);
	});
});
