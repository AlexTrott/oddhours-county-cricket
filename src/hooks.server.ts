import {
	FAVOURITE_COOKIE,
	SCHEME_COOKIE,
	COMPETITION_COOKIE,
	isCountyId,
	isCompetitionId,
	parseScheme,
	type ColourScheme
} from '$lib/config';
import { ensureDatabase } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';

ensureDatabase();

export const handle: Handle = async ({ event, resolve }) => {
	const favouriteRaw = event.cookies.get(FAVOURITE_COOKIE) ?? null;
	const favourite = isCountyId(favouriteRaw) ? favouriteRaw : null;
	const scheme: ColourScheme = parseScheme(event.cookies.get(SCHEME_COOKIE));
	const competitionRaw = event.cookies.get(COMPETITION_COOKIE) ?? null;
	const competition =
		competitionRaw === 'all' || isCompetitionId(competitionRaw) ? competitionRaw : null;
	event.locals.favourite = favourite;
	event.locals.scheme = scheme;
	event.locals.competition = competition;

	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const attrs = ['lang="en-GB"', 'class="theme-petrol"'];
			if (favourite) attrs.push(`data-county="${favourite}"`);
			if (scheme === 'dark') attrs.push('data-scheme="dark"');
			return html.replace('<html lang="en-GB" class="theme-petrol">', `<html ${attrs.join(' ')}>`);
		}
	});
};
