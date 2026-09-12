import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { appConfig, COUNTY_IDS, competitions, counties } from '../src/lib/config/index.js';

describe('config schema', () => {
	it('has eighteen first-class counties', () => {
		expect(counties).toHaveLength(18);
		expect(new Set(COUNTY_IDS).size).toBe(18);
	});

	it('stores official public YouTube channel IDs', () => {
		for (const county of counties) {
			expect(county.youtubeChannelId).toMatch(/^UC[\w-]{22}$/);
		}
	});

	it('defines Championship, Blast, and One-Day Cup from config', () => {
		expect(competitions.map((competition) => competition.id).sort()).toEqual(
			['blast', 'championship', 'one-day-cup'].sort()
		);
		const championship = competitions.find((competition) => competition.id === 'championship');
		expect(championship?.groups.map((group) => group.id)).toEqual(['division-one', 'division-two']);
		expect(championship?.groups[0].teamIds).toHaveLength(10);
		expect(championship?.groups[1].teamIds).toHaveLength(8);
		const blast = competitions.find((competition) => competition.id === 'blast');
		expect(blast?.groups).toHaveLength(3);
		expect(blast?.groups.every((group) => group.teamIds.length === 6)).toBe(true);
	});

	it('covers every county in every competition', () => {
		for (const competition of competitions) {
			const ids = competition.groups.flatMap((group) => group.teamIds);
			expect(new Set(ids).size).toBe(18);
		}
	});

	it('stores polling intervals, source selection, and ESPN series IDs', () => {
		expect(appConfig.polling.liveSeconds).toBeGreaterThan(0);
		expect(appConfig.sources.primary).toBe('espncricinfo');
		expect(appConfig.sources.fallbacks).toEqual([]);
		expect(appConfig.sources.blocked.map((item) => item.id).sort()).toEqual(['bbc', 'cricbuzz']);
		expect(appConfig.series.championshipDivisionOne.espnLeagueId).toBe('8052');
		expect(appConfig.series.blast.espnLeagueId).toBe('8053');
		expect(appConfig.takedownIssuesUrl).toContain('github.com');
	});

	it('does not hard-code Championship groups in the standings UI', () => {
		const page = readFileSync(
			new URL('../src/routes/standings/+page.svelte', import.meta.url),
			'utf8'
		);
		expect(page).not.toMatch(/Division One/);
		expect(page).toContain('data.competitions');
	});
});
