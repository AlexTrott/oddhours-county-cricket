import { json } from '@sveltejs/kit';
import { ingestionEnabled } from '$lib/config';
import { assembleFreshness } from '$lib/ingest/freshness';
import { getMeta, listMatches } from '$lib/server/queries';

export const GET = () => {
	const live = listMatches({ status: 'live' });
	const freshness = assembleFreshness({
		ingestEnabled: ingestionEnabled(),
		source: getMeta('source') ?? 'seed',
		updatedAt: getMeta('updated_at'),
		liveUpdatedAt: getMeta('live_updated_at'),
		fixturesUpdatedAt: getMeta('fixtures_updated_at'),
		standingsUpdatedAt: getMeta('standings_updated_at'),
		staleMatches: live.filter((match) => match.stale).length,
		liveCount: live.length
	});
	return json({
		live,
		updatedAt: getMeta('updated_at'),
		freshness
	});
};
