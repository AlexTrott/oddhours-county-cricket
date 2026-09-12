import { appConfig } from '../config/index.js';
import { bbcProvider } from './bbc.js';
import { cricbuzzProvider } from './cricbuzz.js';
import { espncricinfoProvider } from './espncricinfo.js';
import { rssProvider } from './rss-provider.js';
import type { ScoreProvider } from './types.js';

export const providers: Record<ScoreProvider['id'], ScoreProvider> = {
	espncricinfo: espncricinfoProvider,
	'espncricinfo-rss': rssProvider,
	bbc: bbcProvider,
	cricbuzz: cricbuzzProvider
};

export function primaryProvider(): ScoreProvider {
	return providers[appConfig.sources.primary];
}

export { bbcProvider, cricbuzzProvider, espncricinfoProvider, rssProvider };
export type { ScoreProvider, ProviderResult, ProviderMatch } from './types.js';
export { NotCutOverError, IngestDisabledError } from './types.js';
