import { error } from '@sveltejs/kit';
import { getCounty, groupForTeam } from '$lib/config';
import { listMatches, listStandings } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const county = getCounty(params.slug);
	if (!county) error(404, 'Unknown county');
	const championship = groupForTeam('championship', county.id);
	return {
		county,
		matches: listMatches({ teamId: county.id }),
		championship: championship
			? {
					groupName: championship.groupName,
					rows: listStandings(championship.competition.id, championship.groupId)
				}
			: null
	};
};
