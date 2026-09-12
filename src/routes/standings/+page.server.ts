import {
	competitions,
	COMPETITION_COOKIE,
	defaultCompetitionId,
	defaultGroupId,
	isCompetitionId
} from '$lib/config';
import { cookieBase } from '$lib/cookies';
import { listStandings } from '$lib/server/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, locals }) => {
	const cookieComp = cookies.get(COMPETITION_COOKIE) ?? null;
	const requestedComp = url.searchParams.get('comp');
	const competitionId = isCompetitionId(requestedComp)
		? requestedComp
		: defaultCompetitionId(cookieComp, locals.favourite) === 'all'
			? competitions[0].id
			: defaultCompetitionId(cookieComp, locals.favourite);
	const competition = competitions.find((item) => item.id === competitionId) ?? competitions[0];
	const requestedGroup = url.searchParams.get('group');
	const groupId =
		competition.groups.find((item) => item.id === requestedGroup)?.id ??
		defaultGroupId(competition.id, locals.favourite);

	return {
		competitions,
		competitionId: competition.id,
		groupId,
		format: competition.format,
		rows: listStandings(competition.id, groupId)
	};
};

export const actions: Actions = {
	rememberCompetition: async ({ request, cookies }) => {
		const form = await request.formData();
		const raw = String(form.get('comp') ?? '');
		if (isCompetitionId(raw)) cookies.set(COMPETITION_COOKIE, raw, cookieBase);
		return { competition: raw };
	}
};
