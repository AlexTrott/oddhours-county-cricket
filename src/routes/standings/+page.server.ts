import { competitions } from '$lib/config';
import { listStandings } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const defaultComp = competitions[0];
	const requestedComp = url.searchParams.get('comp') ?? defaultComp.id;
	const competition = competitions.find((item) => item.id === requestedComp) ?? defaultComp;
	const requestedGroup = url.searchParams.get('group') ?? competition.groups[0].id;
	const group =
		competition.groups.find((item) => item.id === requestedGroup) ?? competition.groups[0];

	return {
		competitions,
		competitionId: competition.id,
		groupId: group.id,
		format: competition.format,
		rows: listStandings(competition.id, group.id)
	};
};
