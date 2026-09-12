import type { ScoreProvider } from './types.js';

export const bbcProvider: ScoreProvider = {
	id: 'bbc',
	label: 'BBC Sport',
	enabled: false,
	reason:
		'BBC robots.txt and Terms of Use forbid scraping, crawling, and systematic extraction. Not used as a fallback.',
	async fetchLiveMatches() {
		return {
			ok: false as const,
			skipped: true as const,
			reason: this.reason ?? 'blocked'
		};
	}
};
