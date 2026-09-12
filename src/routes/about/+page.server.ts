import { appConfig } from '$lib/config';

export const load = () => ({
	takedownEmail: appConfig.takedownEmail,
	takedownIssuesUrl: appConfig.takedownIssuesUrl,
	season: appConfig.season
});
