import { NotCutOverError, type ScoreProvider } from './types.js';

export const espncricinfoProvider: ScoreProvider = {
	id: 'espncricinfo',
	label: 'ESPNCricinfo',
	enabled: true,
	async fetchLiveMatches() {
		throw new NotCutOverError('espncricinfo');
	}
};
