import { appConfig, ingestUserAgent } from '../config/index.js';
import {
	crawlDelaySeconds,
	isPathAllowed,
	parseRobotsTxt,
	robotsHostApplies,
	type RobotsRules
} from './robots.js';

export type LoadedRobots = {
	sourceUrl: string;
	host: string;
	rules: RobotsRules;
};

export class RateLimiter {
	private last = 0;
	constructor(private readonly minIntervalMs: number) {}
	async wait(): Promise<void> {
		const wait = this.last + this.minIntervalMs - Date.now();
		if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
		this.last = Date.now();
	}
}

export type FetchedPayload = {
	url: string;
	status: number;
	ok: boolean;
	body: string;
	fetchedAt: string;
};

const robotsCache = new Map<string, { at: number; loaded: LoadedRobots | null }>();

export async function loadRobots(
	urls: string[],
	fetchImpl: typeof fetch = fetch
): Promise<LoadedRobots[]> {
	const loaded: LoadedRobots[] = [];
	for (const url of urls) {
		const cached = robotsCache.get(url);
		if (cached && Date.now() - cached.at < 60 * 60 * 1000) {
			if (cached.loaded) loaded.push(cached.loaded);
			continue;
		}
		try {
			const response = await fetchImpl(url, {
				headers: { 'user-agent': ingestUserAgent() }
			});
			if (!response.ok) {
				robotsCache.set(url, { at: Date.now(), loaded: null });
				continue;
			}
			const parsed = parseRobotsTxt(await response.text());
			const item: LoadedRobots = {
				sourceUrl: url,
				host: new URL(url).hostname,
				rules: parsed
			};
			robotsCache.set(url, { at: Date.now(), loaded: item });
			loaded.push(item);
		} catch {
			robotsCache.set(url, { at: Date.now(), loaded: null });
		}
	}
	return loaded;
}

export function urlAllowed(target: string, robots: LoadedRobots[], userAgent: string): boolean {
	try {
		const parsed = new URL(target);
		const path = `${parsed.pathname}${parsed.search}`;
		for (const item of robots) {
			if (!robotsHostApplies(parsed.hostname, item.host)) continue;
			if (!isPathAllowed(item.rules, path, userAgent)) return false;
		}
		return true;
	} catch {
		return false;
	}
}

export function minIntervalMs(robots: LoadedRobots[]): number {
	const delays = robots
		.map((item) => crawlDelaySeconds(item.rules, ingestUserAgent()))
		.filter((item): item is number => item != null)
		.map((seconds) => seconds * 1000);
	return Math.max(appConfig.ingestion.minIntervalMs, ...delays, 0);
}

export async function ingestFetch(
	url: string,
	opts: {
		fetchImpl?: typeof fetch;
		limiter: RateLimiter;
		robots: LoadedRobots[];
	}
): Promise<FetchedPayload> {
	const fetchImpl = opts.fetchImpl ?? fetch;
	const ua = ingestUserAgent();
	if (!urlAllowed(url, opts.robots, ua)) {
		return {
			url,
			status: 0,
			ok: false,
			body: `blocked by robots.txt: ${url}`,
			fetchedAt: new Date().toISOString()
		};
	}
	await opts.limiter.wait();
	const response = await fetchImpl(url, {
		headers: {
			'user-agent': ua,
			accept: 'application/json, application/xml, text/xml, text/plain;q=0.9'
		}
	});
	const body = await response.text();
	return {
		url,
		status: response.status,
		ok: response.ok,
		body,
		fetchedAt: new Date().toISOString()
	};
}

export function scoreboardUrl(espnId: string, yyyymmdd?: string): string {
	const base = `${appConfig.espn.scoreboardHost}/apis/site/v2/sports/cricket/${espnId}/scoreboard`;
	return yyyymmdd ? `${base}?dates=${yyyymmdd}` : base;
}

export function standingsUrl(espnId: string): string {
	return `${appConfig.espn.standingsHost}/apis/v2/sports/cricket/${espnId}/standings`;
}

export function summaryUrl(espnId: string, eventId: string): string {
	return `${appConfig.espn.scoreboardHost}/apis/site/v2/sports/cricket/${espnId}/summary?event=${eventId}`;
}
