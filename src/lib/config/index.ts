import './validate.js';

import { appConfig } from './app.js';

export { appConfig };
export { counties, countyById, getCounty, COUNTY_IDS } from './counties.js';
export { competitions, competitionById, getCompetition, groupForTeam } from './competitions.js';
export {
	FAVOURITE_COOKIE,
	SCHEME_COOKIE,
	FAVOURITE_STORAGE_KEY,
	SCHEME_STORAGE_KEY,
	countyOverlayCss,
	isCountyId,
	parseScheme,
	paletteFor,
	themeColorFor,
	type ColourScheme
} from './overlay.js';
export type { County, Competition, AppConfig, Palette, SourceId, SeriesEntry } from './schema.js';

export function ingestSeriesList() {
	const { series } = appConfig;
	return [
		series.championshipDivisionOne,
		series.championshipDivisionTwo,
		series.blast,
		series.oneDayCup
	];
}
