import { fail } from '@sveltejs/kit';
import { FAVOURITE_COOKIE, getCounty, groupForTeam, isCountyId } from '$lib/config';
import { cookieBase } from '$lib/cookies';
import { listMatches, listStandings } from '$lib/server/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const favourite = locals.favourite;
	const matches = favourite ? listMatches({ teamId: favourite }) : [];
	const championship = favourite ? groupForTeam('championship', favourite) : undefined;
	const blast = favourite ? groupForTeam('blast', favourite) : undefined;
	const odc = favourite ? groupForTeam('one-day-cup', favourite) : undefined;
	return {
		favourite,
		county: favourite ? getCounty(favourite) : null,
		matches,
		tables: {
			championship: championship
				? listStandings(championship.competition.id, championship.groupId)
				: [],
			blast: blast ? listStandings(blast.competition.id, blast.groupId) : [],
			oneDayCup: odc ? listStandings(odc.competition.id, odc.groupId) : []
		}
	};
};

export const actions: Actions = {
	setFavourite: async ({ request, cookies }) => {
		const form = await request.formData();
		const raw = String(form.get('county') ?? '');
		if (!raw) {
			cookies.delete(FAVOURITE_COOKIE, { path: '/' });
			return { favourite: null };
		}
		if (!isCountyId(raw)) return fail(400, { message: 'Unknown county' });
		cookies.set(FAVOURITE_COOKIE, raw, cookieBase);
		return { favourite: raw };
	}
};
