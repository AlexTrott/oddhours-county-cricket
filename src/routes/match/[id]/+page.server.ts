import { error } from '@sveltejs/kit';
import { getMatch } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const match = getMatch(params.id);
	if (!match) error(404, 'Match not found');
	return { match };
};
