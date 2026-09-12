import { appConfig } from './app.js';

function truthy(value: string | undefined): boolean {
	if (!value) return false;
	return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

/** Live network ingest. Seed is the offline default. */
export function ingestionEnabled(): boolean {
	if (truthy(process.env.INGESTION_ENABLED)) return true;
	if (
		['0', 'false', 'no', 'off'].includes((process.env.INGESTION_ENABLED ?? '').trim().toLowerCase())
	) {
		return false;
	}
	return appConfig.ingestion.enabled;
}

export function ingestContactEmail(): string {
	const fromEnv = process.env.INGEST_CONTACT_EMAIL?.trim();
	if (fromEnv) return fromEnv;
	return appConfig.takedownEmail;
}

export function ingestUserAgent(): string {
	return `${appConfig.ingestion.userAgentName} (+https://github.com/AlexTrott/oddhours-county-cricket; contact ${ingestContactEmail()})`;
}
