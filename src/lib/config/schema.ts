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
	youtubeChannelId: z.union([z.literal(''), z.string().regex(/^UC[\w-]{22}$/)]),
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

export const sourceIdSchema = z.enum(['espncricinfo', 'bbc', 'cricbuzz']);

export const seriesEntrySchema = z.object({
	url: z.string().url(),
	espnLeagueId: z.string().regex(/^\d+$/),
	cricinfoSeriesId: z.string().regex(/^\d+$/),
	competitionId: z.string().min(1),
	groupId: z.string().nullable()
});

export const appConfigSchema = z.object({
	season: z.number().int().min(2024),
	siteName: z.string().min(1),
	themeColor: hexSchema,
	polling: z.object({
		liveSeconds: z.number().int().positive(),
		standingsSeconds: z.number().int().positive(),
		fixturesSeconds: z.number().int().positive()
	}),
	sources: z.object({
		primary: sourceIdSchema,
		fallbacks: z.array(sourceIdSchema),
		blocked: z.array(
			z.object({
				id: sourceIdSchema,
				reason: z.string().min(1)
			})
		)
	}),
	takedownEmail: z.string().min(1),
	takedownIssuesUrl: z.string().url(),
	series: z.object({
		championshipDivisionOne: seriesEntrySchema,
		championshipDivisionTwo: seriesEntrySchema,
		blast: seriesEntrySchema,
		oneDayCup: seriesEntrySchema
	})
});

export type Palette = z.infer<typeof paletteSchema>;
export type County = z.infer<typeof countySchema>;
export type Competition = z.infer<typeof competitionSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;
export type SourceId = z.infer<typeof sourceIdSchema>;
export type SeriesEntry = z.infer<typeof seriesEntrySchema>;
