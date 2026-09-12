import { appConfig } from '../config/index.js';
import { bbcProvider } from './bbc.js';
import { cricbuzzProvider } from './cricbuzz.js';
import { espncricinfoProvider } from './espncricinfo.js';
import type { ScoreProvider } from './types.js';

export const providers: Record<ScoreProvider['id'], ScoreProvider> = {
	espncricinfo: espncricinfoProvider,
	bbc: bbcProvider,
	cricbuzz: cricbuzzProvider
};

export function primaryProvider(): ScoreProvider {
	return providers[appConfig.sources.primary];
}

export { bbcProvider, cricbuzzProvider, espncricinfoProvider };
export type { ScoreProvider, ProviderResult, ProviderMatch } from './types.js';
export { NotCutOverError } from './types.js';
