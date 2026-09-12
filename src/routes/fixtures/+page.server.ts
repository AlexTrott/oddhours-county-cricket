import {
	competitions,
	COMPETITION_COOKIE,
	defaultCompetitionId,
	isCompetitionId
} from '$lib/config';
import { cookieBase } from '$lib/cookies';
import { listMatches } from '$lib/server/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, locals }) => {
	const cookieComp = cookies.get(COMPETITION_COOKIE) ?? null;
	const requested = url.searchParams.get('comp');
	const competitionId = requested
		? requested === 'all' || isCompetitionId(requested)
			? requested
			: defaultCompetitionId(cookieComp, locals.favourite)
		: defaultCompetitionId(cookieComp, locals.favourite);
	const teamId = url.searchParams.get('team') || null;
	const matches = listMatches({
		competitionId: competitionId === 'all' ? undefined : competitionId,
		teamId: teamId || undefined,
		order: 'date'
	});
	const knockouts = listMatches({
		competitionId: competitionId === 'all' ? undefined : competitionId,
		teamId: teamId || undefined,
		knockout: true,
		order: 'date'
	});
	return {
		competitions,
		competitionId,
		teamId,
		favourite: locals.favourite,
		matches,
		knockouts
	};
};

export const actions: Actions = {
	rememberCompetition: async ({ request, cookies }) => {
		const form = await request.formData();
		const raw = String(form.get('comp') ?? '');
		if (raw === 'all' || isCompetitionId(raw)) {
			cookies.set(COMPETITION_COOKIE, raw, cookieBase);
		}
		return { competition: raw };
	}
};
