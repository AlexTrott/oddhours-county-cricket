import { json } from '@sveltejs/kit';
import { getMeta, listMatches } from '$lib/server/queries';

export const GET = () => {
	return json({
		live: listMatches({ status: 'live' }),
		updatedAt: getMeta('updated_at'),
		source: getMeta('source')
	});
};
