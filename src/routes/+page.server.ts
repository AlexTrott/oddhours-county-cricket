import { getMeta, listMatches } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const matches = listMatches();
	return {
		live: matches.filter((match) => match.status === 'live'),
		upcoming: matches.filter((match) => match.status === 'upcoming'),
		completed: matches.filter((match) => match.status === 'completed'),
		updatedAt: getMeta('updated_at'),
		source: getMeta('source')
	};
};
