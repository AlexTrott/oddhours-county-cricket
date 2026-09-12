import { appConfig } from '../config/index.js';
import { primaryProvider, providers } from '../providers/index.js';
import { NotCutOverError } from '../providers/types.js';

export type IngestReport = {
	primary: string;
	blocked: { id: string; reason: string }[];
	result: 'skipped' | 'error';
	message: string;
	network: boolean;
};

/**
 * Separate from web requests. Never scrape inside a page load.
 * Production scrape cutover is a later milestone.
 */
export async function runIngest(): Promise<IngestReport> {
	const blocked = appConfig.sources.blocked.map((item) => ({
		id: item.id,
		reason: providers[item.id].reason ?? item.reason
	}));

	const primary = primaryProvider();
	if (!primary.enabled) {
		return {
			primary: primary.id,
			blocked,
			result: 'skipped',
			message: `${primary.label} is disabled.`,
			network: false
		};
	}

	try {
		await primary.fetchLiveMatches();
		return {
			primary: primary.id,
			blocked,
			result: 'skipped',
			message: 'Unexpected success from stub provider.',
			network: false
		};
	} catch (error) {
		if (error instanceof NotCutOverError) {
			return {
				primary: primary.id,
				blocked,
				result: 'skipped',
				message:
					'Live production scrape is not cut over. Seeded SQLite is unchanged. ESPNCricinfo remains the primary path for a later ingest.',
				network: false
			};
		}
		throw error;
	}
}
