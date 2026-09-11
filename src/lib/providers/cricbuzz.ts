import type { ScoreProvider } from './types.js';

export const cricbuzzProvider: ScoreProvider = {
	id: 'cricbuzz',
	label: 'Cricbuzz',
	enabled: false,
	reason: 'Cricbuzz robots.txt Disallow: / for generic user-agents. Not used as a fallback.',
	async fetchLiveMatches() {
		return {
			ok: false,
			skipped: true,
			reason: this.reason ?? 'blocked'
		};
	}
};
