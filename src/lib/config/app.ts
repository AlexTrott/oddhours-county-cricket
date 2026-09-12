import { appConfigSchema, type AppConfig } from './schema.js';

export const appConfig: AppConfig = appConfigSchema.parse({
	season: 2026,
	siteName: 'County Cricket Live',
	themeColor: '#1c7e84',
	polling: {
		liveSeconds: 30,
		standingsSeconds: 300,
		fixturesSeconds: 900
	},
	sources: {
		primary: 'espncricinfo',
		fallbacks: [],
		blocked: [
			{
				id: 'bbc',
				reason:
					'BBC robots.txt and Terms of Use forbid scraping, crawling, and systematic extraction. Not a fallback.'
			},
			{
				id: 'cricbuzz',
				reason: 'Cricbuzz robots.txt Disallow: / for generic user-agents. Not a fallback.'
			}
		]
	},
	takedownEmail: process.env.TAKEDOWN_EMAIL?.trim() || 'takedown@example.com',
	takedownIssuesUrl: 'https://github.com/AlexTrott/oddhours-county-cricket/issues',
	series: {
		championshipDivisionOne: {
			url: 'https://www.espncricinfo.com/series/county-championship-division-one-2026-1513323',
			espnLeagueId: '8052',
			cricinfoSeriesId: '1513323',
			competitionId: 'championship',
			groupId: 'division-one'
		},
		championshipDivisionTwo: {
			url: 'https://www.espncricinfo.com/series/county-championship-division-two-2026-1513324',
			espnLeagueId: '8204',
			cricinfoSeriesId: '1513324',
			competitionId: 'championship',
			groupId: 'division-two'
		},
		blast: {
			url: 'https://www.espncricinfo.com/series/vitality-blast-2026-1512690',
			espnLeagueId: '8053',
			cricinfoSeriesId: '1512690',
			competitionId: 'blast',
			groupId: null
		},
		oneDayCup: {
			url: 'https://www.espncricinfo.com/series/metro-bank-one-day-cup-2026-1513325',
			espnLeagueId: '8335',
			cricinfoSeriesId: '1513325',
			competitionId: 'one-day-cup',
			groupId: null
		}
	}
});
