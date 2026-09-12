import { SCHEME_COOKIE, parseScheme, appConfig } from '$lib/config';
import { cookieBase } from '$lib/cookies';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		scheme: locals.scheme,
		polling: appConfig.polling
	};
};

export const actions: Actions = {
	setScheme: async ({ request, cookies }) => {
		const form = await request.formData();
		const scheme = parseScheme(String(form.get('scheme') ?? 'light'));
		cookies.set(SCHEME_COOKIE, scheme, cookieBase);
		return { scheme };
	}
};
