import { env } from '$env/dynamic/private';
import { appConfig } from '$lib/config';

export const load = () => ({
	takedownEmail: env.TAKEDOWN_EMAIL?.trim() || appConfig.takedownEmail,
	takedownIssuesUrl: appConfig.takedownIssuesUrl,
	season: appConfig.season
});
