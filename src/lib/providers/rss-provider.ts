import type { ScoreProvider } from './types.js';

export const rssProvider: ScoreProvider = {
	id: 'espncricinfo-rss',
	label: 'ESPNCricinfo live scores RSS',
	enabled: true,
	reason:
		'Headline-only fallback for live discovery (static.espncricinfo.com/rss/livescores.xml). No scorecards. Women’s cricket is filtered out.',
	async fetchLiveMatches() {
		return {
			ok: false,
			skipped: true,
			reason: 'RSS is ingested from pnpm ingest as a live-discovery fallback, not from page loads.'
		};
	}
};
