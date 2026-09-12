import { z } from 'zod';

export const hexSchema = z.string().regex(/^#[0-9a-f]{6}$/i, 'hex colour must be #rrggbb');

export const paletteSchema = z.object({
	band: hexSchema,
	bandFg: hexSchema,
	accent: hexSchema,
	accentHot: hexSchema
});

export const countySchema = z.object({
	id: z.string().regex(/^[a-z]+$/),
	name: z.string().min(1),
	shortName: z.string().min(1),
	abbreviation: z.string().regex(/^[A-Z]{3}$/),
	blastName: z.string().min(1),
	homeGround: z.string().min(1),
	youtubeChannelId: z.string(),
	palette: z.object({
		light: paletteSchema,
		dark: paletteSchema
	})
});

export const competitionGroupSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	teamIds: z.array(z.string()).min(1)
});

export const competitionSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	shortName: z.string().min(1),
	format: z.enum(['first-class', 't20', 'lista']),
	groups: z.array(competitionGroupSchema).min(1)
});

export const sourceIdSchema = z.enum(['espncricinfo', 'espncricinfo-rss', 'bbc', 'cricbuzz']);

export const dataTypeSchema = z.enum(['live', 'fixtures', 'standings']);

export const espnLeagueSchema = z.object({
	espnId: z.string().min(1),
	seriesId: z.string().min(1),
	competitionId: z.string().min(1),
	groupId: z.string().nullable(),
	format: z.enum(['first-class', 't20', 'lista'])
});

export const appConfigSchema = z.object({
	season: z.number().int().min(2024),
	siteName: z.string().min(1),
	themeColor: hexSchema,
	ingestion: z.object({
		enabled: z.boolean(),
		minIntervalMs: z.number().int().positive(),
		userAgentName: z.string().min(1)
	}),
	polling: z.object({
		/** UI poll of local /api/live (not ESPN). */
		liveSeconds: z.number().int().positive(),
		liveMinSeconds: z.number().int().positive(),
		liveMaxSeconds: z.number().int().positive(),
		fixturesMatchDaySeconds: z.number().int().positive(),
		fixturesIdleSeconds: z.number().int().positive(),
		standingsLiveSeconds: z.number().int().positive(),
		standingsIdleSeconds: z.number().int().positive(),
		standingsSeconds: z.number().int().positive(),
		fixturesSeconds: z.number().int().positive()
	}),
	freshness: z.object({
		delayedSeconds: z.number().int().positive(),
		unavailableSeconds: z.number().int().positive()
	}),
	sources: z.object({
		primary: sourceIdSchema,
		fallbacks: z.array(sourceIdSchema),
		byType: z.object({
			live: z.object({
				primary: sourceIdSchema,
				fallbacks: z.array(sourceIdSchema)
			}),
			fixtures: z.object({
				primary: sourceIdSchema,
				fallbacks: z.array(sourceIdSchema)
			}),
			standings: z.object({
				primary: sourceIdSchema,
				fallbacks: z.array(sourceIdSchema)
			})
		}),
		blocked: z.array(
			z.object({
				id: sourceIdSchema,
				reason: z.string().min(1)
			})
		)
	}),
	espn: z.object({
		scoreboardHost: z.string().url(),
		standingsHost: z.string().url(),
		rssUrl: z.string().url(),
		robotsUrls: z.array(z.string().url()),
		leagues: z.array(espnLeagueSchema).min(1)
	}),
	takedownEmail: z.string().min(1),
	series: z.object({
		championshipDivisionOne: z.string(),
		championshipDivisionTwo: z.string(),
		blast: z.string(),
		oneDayCup: z.string()
	})
});

export type Palette = z.infer<typeof paletteSchema>;
export type County = z.infer<typeof countySchema>;
export type Competition = z.infer<typeof competitionSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;
export type SourceId = z.infer<typeof sourceIdSchema>;
