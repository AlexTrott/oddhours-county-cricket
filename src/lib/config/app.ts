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
	takedownEmail: 'takedown@example.com',
	series: {
		championshipDivisionOne:
			'https://www.espncricinfo.com/series/county-championship-division-one-2026',
		championshipDivisionTwo:
			'https://www.espncricinfo.com/series/county-championship-division-two-2026-1513324',
		blast: 'https://www.espncricinfo.com/series/vitality-blast-2026',
		oneDayCup: 'https://www.espncricinfo.com/series/metro-bank-one-day-cup-2026'
	}
});
