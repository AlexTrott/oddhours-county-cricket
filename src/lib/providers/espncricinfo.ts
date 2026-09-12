import { ingestionEnabled } from '../config/index.js';
import { IngestDisabledError, type ScoreProvider } from './types.js';

export const espncricinfoProvider: ScoreProvider = {
	id: 'espncricinfo',
	label: 'ESPNCricinfo',
	enabled: true,
	async fetchLiveMatches() {
		if (!ingestionEnabled()) {
			throw new IngestDisabledError();
		}
		return {
			ok: false,
			skipped: true,
			reason: 'Use pnpm ingest — provider methods are not called from page loads.'
		};
	}
};
