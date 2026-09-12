import { ingestionEnabled } from '$lib/config';
import { assembleFreshness } from '$lib/ingest/freshness';
import { getMeta, listMatches } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const matches = listMatches();
	const live = matches.filter((match) => match.status === 'live');
	const stale = matches.filter((match) => match.stale).length;
	const freshness = assembleFreshness({
		ingestEnabled: ingestionEnabled(),
		source: getMeta('source') ?? 'seed',
		updatedAt: getMeta('updated_at'),
		liveUpdatedAt: getMeta('live_updated_at'),
		fixturesUpdatedAt: getMeta('fixtures_updated_at'),
		standingsUpdatedAt: getMeta('standings_updated_at'),
		staleMatches: stale,
		liveCount: live.length
	});
	return {
		live,
		upcoming: matches.filter((match) => match.status === 'upcoming').slice(0, 6),
		completed: matches.filter((match) => match.status === 'completed').slice(0, 6),
		updatedAt: getMeta('updated_at'),
		source: getMeta('source'),
		freshness
	};
};
