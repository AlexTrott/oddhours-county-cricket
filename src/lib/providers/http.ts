import { IngestNetworkGuardError } from './types.js';

export const INGEST_USER_AGENT =
	'CountyCricketLive/0.1 (+https://github.com/AlexTrott/oddhours-county-cricket)';

export const ESPN_SITE_API = 'https://site.web.api.espn.com';
export const ESPN_ROBOTS_URL = 'https://www.espn.com/robots.txt';
export const CRICINFO_ROBOTS_URL = 'https://espncricinfo.com/robots.txt';

const DEFAULT_GAP_MS = 800;
const DEFAULT_TIMEOUT_MS = 20_000;

export type PoliteGetOptions = {
	gapMs?: number;
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
	now?: () => number;
	sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rate-limited GET for ingest only. Unit tests (VITEST) cannot use this
 * unless CCL_INGEST_NETWORK=1. Never import from request handlers.
 */
export function createPoliteGet(options: PoliteGetOptions = {}) {
	const gapMs = options.gapMs ?? DEFAULT_GAP_MS;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const fetchImpl = options.fetchImpl ?? fetch;
	const now = options.now ?? Date.now;
	const sleep = options.sleep ?? defaultSleep;
	let lastAt = 0;

	return async function politeGet(
		url: string
	): Promise<{ status: number; body: string; url: string }> {
		if (process.env.VITEST === 'true' && process.env.CCL_INGEST_NETWORK !== '1') {
			throw new IngestNetworkGuardError();
		}
		const wait = lastAt + gapMs - now();
		if (wait > 0) await sleep(wait);
		lastAt = now();

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const response = await fetchImpl(url, {
				headers: {
					'User-Agent': INGEST_USER_AGENT,
					Accept: 'application/json, text/plain, */*'
				},
				signal: controller.signal,
				redirect: 'follow'
			});
			const body = await response.text();
			return { status: response.status, body, url: response.url };
		} finally {
			clearTimeout(timer);
		}
	};
}

export const politeGet = createPoliteGet();
