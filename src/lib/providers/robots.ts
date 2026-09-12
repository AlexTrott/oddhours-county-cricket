export type RobotsGroup = {
	agents: string[];
	allow: string[];
	disallow: string[];
	crawlDelay: number | null;
};

export type RobotsTxt = {
	groups: RobotsGroup[];
};

function matchesRule(pathname: string, rule: string): boolean {
	if (rule === '') return false;
	if (rule === '/') return true;
	const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
	return new RegExp('^' + escaped).test(pathname);
}

export function parseRobotsTxt(text: string): RobotsTxt {
	const groups: RobotsGroup[] = [];
	let current: RobotsGroup | null = null;
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.replace(/#.*$/, '').trim();
		if (!line) continue;
		const colon = line.indexOf(':');
		if (colon === -1) continue;
		const key = line.slice(0, colon).trim().toLowerCase();
		const value = line.slice(colon + 1).trim();
		if (key === 'user-agent') {
			const agent = value.toLowerCase();
			if (current && current.allow.length + current.disallow.length > 0) {
				groups.push(current);
				current = { agents: [agent], allow: [], disallow: [], crawlDelay: null };
			} else if (current) {
				current.agents.push(agent);
			} else {
				current = { agents: [agent], allow: [], disallow: [], crawlDelay: null };
			}
			continue;
		}
		if (!current) continue;
		if (key === 'disallow') current.disallow.push(value);
		else if (key === 'allow') current.allow.push(value);
		else if (key === 'crawl-delay') {
			const delay = Number(value);
			if (Number.isFinite(delay)) current.crawlDelay = delay;
		}
	}
	if (current) groups.push(current);
	return { groups };
}

function matchingGroup(robots: RobotsTxt, userAgent: string): RobotsGroup | null {
	const ua = userAgent.split(/[/\s]/)[0]?.toLowerCase() ?? userAgent.toLowerCase();
	const specific = robots.groups.find((group) =>
		group.agents.some((agent) => agent !== '*' && (ua.startsWith(agent) || agent.startsWith(ua)))
	);
	if (specific) return specific;
	return robots.groups.find((group) => group.agents.includes('*')) ?? null;
}

/** Longest matching Allow/Disallow wins. Allow wins ties. */
export function isPathAllowed(
	robots: RobotsTxt,
	userAgent: string,
	pathnameAndQuery: string
): boolean {
	const group = matchingGroup(robots, userAgent);
	if (!group) return true;
	let best: { type: 'allow' | 'disallow'; length: number } | null = null;
	for (const rule of group.disallow) {
		if (matchesRule(pathnameAndQuery, rule) && (!best || rule.length > best.length)) {
			best = { type: 'disallow', length: rule.length };
		}
	}
	for (const rule of group.allow) {
		if (matchesRule(pathnameAndQuery, rule) && (!best || rule.length >= best.length)) {
			best = { type: 'allow', length: rule.length };
		}
	}
	if (!best) return true;
	return best.type === 'allow';
}

export type IngestRobotsCheck = {
	ok: boolean;
	reason?: string;
	espnApiAllowed: boolean;
	cricinfoHtmlAllowed: boolean;
};

export function evaluateIngestRobots(opts: {
	espnRobots: string | null;
	cricinfoRobots: string | null;
	userAgent: string;
}): IngestRobotsCheck {
	if (!opts.espnRobots && !opts.cricinfoRobots) {
		return {
			ok: false,
			espnApiAllowed: false,
			cricinfoHtmlAllowed: false,
			reason: 'Could not fetch robots.txt from ESPN or ESPNCricinfo. Ingest skipped.'
		};
	}

	let espnApiAllowed = true;
	if (opts.espnRobots) {
		const robots = parseRobotsTxt(opts.espnRobots);
		espnApiAllowed = isPathAllowed(
			robots,
			opts.userAgent,
			'/apis/site/v2/sports/cricket/scoreboard'
		);
	}

	let cricinfoHtmlAllowed = false;
	if (opts.cricinfoRobots) {
		const robots = parseRobotsTxt(opts.cricinfoRobots);
		cricinfoHtmlAllowed = isPathAllowed(robots, opts.userAgent, '/series/county-championship');
	}

	if (!espnApiAllowed) {
		return {
			ok: false,
			espnApiAllowed,
			cricinfoHtmlAllowed,
			reason: 'ESPN robots.txt disallows the cricket scoreboard path. Ingest skipped.'
		};
	}

	return { ok: true, espnApiAllowed, cricinfoHtmlAllowed };
}
