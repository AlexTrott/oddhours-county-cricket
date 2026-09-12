import { listMatches } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		matches: listMatches()
	};
};
