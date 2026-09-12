import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	parseScoreboard,
	parseStandings,
	parseSummaryScorecard,
	parseCompactFixture
} from '../src/lib/providers/espn-parse.js';
import { parseLiveScoresRss } from '../src/lib/providers/rss.js';
import { parseRound } from '../src/lib/providers/espn-teams.js';

function loadJson(name: string) {
	return JSON.parse(
		readFileSync(new URL(`./fixtures/espn/${name}`, import.meta.url), 'utf8')
	) as unknown;
}

describe('ESPN scoreboard parsers', () => {
	it('parses a declared first-class innings', () => {
		const parsed = parseScoreboard(loadJson('scoreboard-declared.json'), '8052');
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		const match = parsed.value[0];
		expect(match.homeTeamId).toBe('sussex');
		expect(match.awayTeamId).toBe('surrey');
		expect(match.status).toBe('completed');
		expect(match.innings.some((innings) => innings.declared)).toBe(true);
		expect(match.resultText?.toLowerCase()).toContain('drawn');
	});

	it('detects follow-on from consecutive innings and (f/o) score', () => {
		const parsed = parseScoreboard(loadJson('scoreboard-follow-on.json'), '8052');
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.value[0].followOn).toBe(true);
		expect(parsed.value[0].resultText?.toLowerCase()).toContain('inns');
	});

	it('labels Blast knockouts from the description, not status.detail=Final', () => {
		expect(parseRound('1st quarter final, Vitality Blast Men at Southampton')).toBe(
			'quarter-final'
		);
		expect(parseRound('1st semi-final, Vitality Blast Men at Birmingham')).toBe('semi-final');
		expect(parseRound('Final (N), Vitality Blast Men at Birmingham')).toBe('final');
		const parsed = parseScoreboard(loadJson('scoreboard-knockout.json'), '8053');
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.value.map((match) => match.round)).toEqual(['semi-final', 'semi-final', 'final']);
	});

	it('keeps upcoming limited-overs matches without overwriting a score', () => {
		const parsed = parseScoreboard(loadJson('scoreboard-upcoming.json'), '8335');
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.value[0].status).toBe('upcoming');
		expect(parsed.value[0].round).toBe('final');
	});

	it('maps live, stumps, rain delay, and abandoned states', () => {
		const live = parseScoreboard(loadJson('scoreboard-live.json'), '8052');
		const stumps = parseScoreboard(loadJson('scoreboard-stumps.json'), '8052');
		const rain = parseScoreboard(loadJson('scoreboard-rain.json'), '8052');
		const abandoned = parseScoreboard(loadJson('scoreboard-abandoned.json'), '8052');
		expect(live.ok && live.value[0].status).toBe('live');
		expect(stumps.ok && stumps.value[0].session).toBe('stumps');
		expect(rain.ok && rain.value[0].status).toBe('live');
		expect(rain.ok && rain.value[0].session).toBe('rain');
		expect(abandoned.ok && abandoned.value[0].status).toBe('abandoned');
	});

	it('labels quarter-finals from event description', () => {
		const parsed = parseScoreboard(loadJson('scoreboard-quarter-final.json'), '8053');
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.value.every((match) => match.round === 'quarter-final')).toBe(true);
	});
});

describe('ESPN summary scorecard', () => {
	it('reads batting, bowling, extras, and a declaration', () => {
		const board = parseScoreboard(loadJson('scoreboard-declared.json'), '8052');
		expect(board.ok).toBe(true);
		if (!board.ok) return;
		const card = parseSummaryScorecard(loadJson('summary-declared.json'), board.value[0]);
		expect(card.ok).toBe(true);
		if (!card.ok) return;
		expect(card.value.length).toBeGreaterThanOrEqual(3);
		const declared = card.value.find((innings) => innings.declared);
		expect(declared).toBeTruthy();
		expect(card.value.some((innings) => innings.batting.length >= 5)).toBe(true);
		expect(card.value.some((innings) => innings.bowling.length >= 1)).toBe(true);
	});

	it('fails closed when the summary has no batting or bowling rows', () => {
		const board = parseScoreboard(loadJson('scoreboard-live.json'), '8052');
		expect(board.ok).toBe(true);
		if (!board.ok) return;
		const card = parseSummaryScorecard({ rosters: [], matchcards: [] }, board.value[0]);
		expect(card.ok).toBe(false);
	});
});

describe('ESPN standings', () => {
	it('parses Division One without using logos', () => {
		const parsed = parseStandings(
			JSON.parse(
				readFileSync(new URL('../data/seed/espn-2026-standings-8052.json', import.meta.url), 'utf8')
			),
			'8052'
		);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.value).toHaveLength(10);
		expect(parsed.value[0].teamId).toBe('somerset');
		expect(parsed.value[0].points).toBeGreaterThan(0);
	});
});

describe('RSS fallback', () => {
	it('keeps men’s counties and drops women’s cricket', () => {
		const xml = readFileSync(new URL('./fixtures/rss/livescores.xml', import.meta.url), 'utf8');
		const items = parseLiveScoresRss(xml);
		expect(items.some((item) => item.homeTeamId === 'sussex')).toBe(true);
		expect(items.every((item) => item.title.toLowerCase().includes('women') === false)).toBe(true);
		expect(items.some((item) => item.title.includes('England'))).toBe(false);
	});
});

describe('compact captured fixtures', () => {
	it('round-trips a compact snapshot event', () => {
		const parsed = parseCompactFixture({
			id: '1',
			leagueId: '8053',
			date: '2026-07-18T17:45Z',
			description: 'Final (N), Vitality Blast Men at Birmingham',
			summary: 'Northants won by 14 runs',
			state: 'post',
			statusDescription: 'Result',
			venue: 'Edgbaston, Birmingham',
			teams: [
				{
					abbreviation: 'NOR',
					name: 'Northamptonshire',
					homeAway: 'home',
					score: '169',
					linescores: []
				},
				{
					abbreviation: 'HAM',
					name: 'Hampshire',
					homeAway: 'away',
					score: '155',
					linescores: []
				}
			]
		});
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.value.round).toBe('final');
		expect(parsed.value.homeTeamId).toBe('northamptonshire');
	});
});
