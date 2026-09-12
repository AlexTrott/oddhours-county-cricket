import { appConfigSchema, type AppConfig } from './schema.js';

const blocked = [
	{
		id: 'bbc' as const,
		reason:
			'BBC robots.txt and Terms of Use forbid scraping, crawling, and systematic extraction. Not a fallback.'
	},
	{
		id: 'cricbuzz' as const,
		reason: 'Cricbuzz robots.txt Disallow: / for generic user-agents. Not a fallback.'
	}
];

export const appConfig: AppConfig = appConfigSchema.parse({
	season: 2026,
	siteName: 'County Cricket Live',
	themeColor: '#1c7e84',
	ingestion: {
		enabled: false,
		minIntervalMs: 1000,
		userAgentName: 'CountyCricketLive/0.1'
	},
	polling: {
		liveSeconds: 30,
		liveMinSeconds: 30,
		liveMaxSeconds: 45,
		fixturesMatchDaySeconds: 300,
		fixturesIdleSeconds: 3600,
		standingsLiveSeconds: 900,
		standingsIdleSeconds: 21600,
		standingsSeconds: 900,
		fixturesSeconds: 300
	},
	freshness: {
		delayedSeconds: 180,
		unavailableSeconds: 900
	},
	sources: {
		primary: 'espncricinfo',
		fallbacks: [],
		byType: {
			live: { primary: 'espncricinfo', fallbacks: ['espncricinfo-rss'] },
			fixtures: { primary: 'espncricinfo', fallbacks: [] },
			standings: { primary: 'espncricinfo', fallbacks: [] }
		},
		blocked
	},
	espn: {
		scoreboardHost: 'https://site.web.api.espn.com',
		standingsHost: 'https://site.web.api.espn.com',
		rssUrl: 'https://static.espncricinfo.com/rss/livescores.xml',
		robotsUrls: ['https://espncricinfo.com/robots.txt', 'https://www.espn.com/robots.txt'],
		leagues: [
			{
				espnId: '8052',
				seriesId: '1513323',
				competitionId: 'championship',
				groupId: 'division-one',
				format: 'first-class'
			},
			{
				espnId: '8204',
				seriesId: '1513324',
				competitionId: 'championship',
				groupId: 'division-two',
				format: 'first-class'
			},
			{
				espnId: '8053',
				seriesId: '1512690',
				competitionId: 'blast',
				groupId: null,
				format: 't20'
			},
			{
				espnId: '8335',
				seriesId: '1513325',
				competitionId: 'one-day-cup',
				groupId: null,
				format: 'lista'
			}
		]
	},
	takedownEmail: 'takedown@example.com',
	series: {
		championshipDivisionOne:
			'https://www.espncricinfo.com/series/county-championship-division-one-2026-1513323',
		championshipDivisionTwo:
			'https://www.espncricinfo.com/series/county-championship-division-two-2026-1513324',
		blast: 'https://www.espncricinfo.com/series/vitality-blast-2026-1512690',
		oneDayCup: 'https://www.espncricinfo.com/series/metro-bank-one-day-cup-2026-1513325'
	}
});
