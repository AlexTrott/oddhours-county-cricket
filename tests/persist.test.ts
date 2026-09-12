import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { markMatchStale } from '../src/lib/ingest/persist.js';
import { upsertMatches } from '../src/lib/ingest/upsert.js';
import type { ProviderMatch } from '../src/lib/providers/types.js';

const sample: ProviderMatch = {
	externalId: 'persist-1',
	competitionId: 'championship',
	groupId: 'division-one',
	homeTeamId: 'essex',
	awayTeamId: 'somerset',
	venue: 'Chelmsford',
	startAt: '2026-04-10T10:00:00.000Z',
	endAt: null,
	status: 'live',
	format: 'first-class',
	round: null,
	resultText: null,
	followOn: false,
	targetRuns: null,
	targetBalls: null,
	tossWinnerId: null,
	tossDecision: null,
	dayNumber: 1,
	session: 'afternoon',
	innings: [
		{
			number: 1,
			battingTeamId: 'essex',
			runs: 200,
			wickets: 3,
			overs: '50.0',
			declared: false
		}
	],
	scorecard: null
};

describe('persist on parse failure', () => {
	beforeEach(() => {
		process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), 'ccl-')), 'test.sqlite');
	});

	afterEach(async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
	});

	it('marks a match stale instead of deleting good innings', async () => {
		const { closeDb } = await import('../src/lib/server/db.js');
		closeDb();
		upsertMatches([sample]);
		markMatchStale('persist-1', 'parse exploded');
		const { getMatch } = await import('../src/lib/server/queries.js');
		const stored = getMatch('espn-persist-1');
		expect(stored?.stale).toBe(true);
		expect(stored?.innings[0].runs).toBe(200);
	});
});
