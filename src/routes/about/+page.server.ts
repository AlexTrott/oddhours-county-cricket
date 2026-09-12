import { appConfig } from '$lib/config';

export const load = () => ({
	takedownEmail: appConfig.takedownEmail,
	season: appConfig.season
});
