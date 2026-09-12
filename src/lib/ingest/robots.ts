export type RobotsGroup = {
	agents: string[];
	allow: string[];
	disallow: string[];
	crawlDelay: number | null;
};

export type RobotsRules = {
	groups: RobotsGroup[];
};

export function parseRobotsTxt(text: string): RobotsRules {
	const groups: RobotsGroup[] = [];
	let current: RobotsGroup | null = null;
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.replace(/#.*$/, '').trim();
		if (!line) continue;
		const [fieldRaw, ...rest] = line.split(':');
		if (!fieldRaw || rest.length === 0) continue;
		const field = fieldRaw.trim().toLowerCase();
		const value = rest.join(':').trim();
		if (field === 'user-agent') {
			const agent = value.toLowerCase();
			if (
				current &&
				current.agents.length &&
				(current.allow.length || current.disallow.length || current.crawlDelay != null)
			) {
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
		if (field === 'disallow') current.disallow.push(value);
		else if (field === 'allow') current.allow.push(value);
		else if (field === 'crawl-delay') {
			const delay = Number(value);
			if (Number.isFinite(delay)) current.crawlDelay = delay;
		}
	}
	if (current) groups.push(current);
	return { groups };
}

function wildcardToRegExp(pattern: string): RegExp {
	const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
	return new RegExp(`^${escaped}`);
}

function matchingGroup(rules: RobotsRules, userAgent: string): RobotsGroup | null {
	const ua = userAgent.toLowerCase();
	let star: RobotsGroup | null = null;
	let named: RobotsGroup | null = null;
	for (const group of rules.groups) {
		if (group.agents.includes('*')) star = group;
		if (group.agents.some((agent) => agent !== '*' && ua.includes(agent))) named = group;
	}
	return named ?? star;
}

export function isPathAllowed(
	rules: RobotsRules,
	pathAndQuery: string,
	userAgent: string
): boolean {
	const group = matchingGroup(rules, userAgent);
	if (!group) return true;
	const path = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
	let allowed = true;
	let best = -1;
	for (const rule of group.disallow) {
		if (!rule) continue;
		if (wildcardToRegExp(rule).test(path) && rule.length >= best) {
			allowed = false;
			best = rule.length;
		}
	}
	for (const rule of group.allow) {
		if (!rule) continue;
		if (wildcardToRegExp(rule).test(path) && rule.length >= best) {
			allowed = true;
			best = rule.length;
		}
	}
	return allowed;
}

export function crawlDelaySeconds(rules: RobotsRules, userAgent: string): number | null {
	return matchingGroup(rules, userAgent)?.crawlDelay ?? null;
}

/** Apply a robots.txt only to that host and its subdomains (www. stripped). */
export function robotsHostApplies(requestHost: string, robotsHost: string): boolean {
	const req = requestHost.toLowerCase().replace(/^www\./, '');
	const host = robotsHost.toLowerCase().replace(/^www\./, '');
	return req === host || req.endsWith(`.${host}`);
}
