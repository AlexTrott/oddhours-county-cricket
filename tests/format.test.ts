import { describe, expect, it } from 'vitest';
import { ballsRemaining, formatScore } from '../src/lib/format.js';
import { chaseLine } from '../src/lib/match-view.js';
import type { MatchSummary } from '../src/lib/match-types.js';

const liveT20: MatchSummary = {
	id: 'x',
	competitionId: 'blast',
	groupId: 'group-a',
	season: 2026,
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
	followOn: false,
	targetRuns: 179,
	targetBalls: 120,
	tossWinnerId: 'nottinghamshire',
	tossDecision: 'bowl',
	updatedAt: '2026-09-11T18:00:00.000Z',
	round: 'group',
	stale: false,
	source: 'seed',
	sourceKey: null,
	innings: [
		{
			id: 'a',
			number: 1,
			battingTeamId: 'yorkshire',
			runs: 178,
			wickets: 6,
			overs: '20.0',
			declared: false
		},
		{
			id: 'b',
			number: 2,
			battingTeamId: 'nottinghamshire',
			runs: 148,
			wickets: 4,
			overs: '16.2',
			declared: false
		}
	]
};

describe('score formatting', () => {
	it('shows declared wickets and chase maths', () => {
		expect(formatScore(287, 10, false)).toBe('287');
		expect(formatScore(412, 8, true)).toBe('412/8d');
		expect(ballsRemaining(120, '16.2')).toBe(22);
		expect(chaseLine(liveT20)).toBe('Need 31 from 22 balls');
	});
});
