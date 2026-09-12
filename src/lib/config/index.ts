import './validate.js';

export { appConfig } from './app.js';
export { counties, countyById, getCounty, COUNTY_IDS } from './counties.js';
export { competitions, competitionById, getCompetition, groupForTeam } from './competitions.js';
export {
	FAVOURITE_COOKIE,
	SCHEME_COOKIE,
	COMPETITION_COOKIE,
	FAVOURITE_STORAGE_KEY,
	SCHEME_STORAGE_KEY,
	COMPETITION_STORAGE_KEY,
	countyOverlayCss,
	isCountyId,
	parseScheme,
	paletteFor,
	themeColorFor,
	type ColourScheme
} from './overlay.js';
export { ingestionEnabled, ingestContactEmail, ingestUserAgent } from './ingest-env.js';
export { isCompetitionId, defaultCompetitionId, defaultGroupId } from './defaults.js';
export type { County, Competition, AppConfig, Palette, SourceId } from './schema.js';
