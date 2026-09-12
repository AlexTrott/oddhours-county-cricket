import { appConfig } from '../config/index.js';
import { londonDateKey } from '../format.js';

export type CadenceDecision = {
	fetchLive: boolean;
	fetchFixtures: boolean;
	fetchStandings: boolean;
	fullCalendar: boolean;
	sleepSeconds: number;
	matchDay: boolean;
	liveCount: number;
};

export function decideCadence(opts: {
	now?: Date;
	liveCount: number;
	matchDay: boolean;
	lastLiveAt: string | null;
	lastFixturesAt: string | null;
	lastStandingsAt: string | null;
	full: boolean;
}): CadenceDecision {
	const now = opts.now ?? new Date();
	const liveDue = due(
		opts.lastLiveAt,
		opts.liveCount > 0 ? appConfig.polling.liveMinSeconds : Number.POSITIVE_INFINITY,
		now
	);
	const fixturesEvery = opts.matchDay
		? appConfig.polling.fixturesMatchDaySeconds
		: appConfig.polling.fixturesIdleSeconds;
	const standingsEvery =
		opts.liveCount > 0
			? appConfig.polling.standingsLiveSeconds
			: appConfig.polling.standingsIdleSeconds;
	const fetchLive = opts.liveCount > 0 && liveDue;
	const fetchFixtures = opts.full || due(opts.lastFixturesAt, fixturesEvery, now);
	const fetchStandings = opts.full || due(opts.lastStandingsAt, standingsEvery, now);
	const waits = [
		opts.liveCount > 0
			? remaining(opts.lastLiveAt, appConfig.polling.liveMinSeconds, now)
			: Number.POSITIVE_INFINITY,
		remaining(opts.lastFixturesAt, fixturesEvery, now),
		remaining(opts.lastStandingsAt, standingsEvery, now)
	].filter((item) => Number.isFinite(item));
	const sleepSeconds = Math.max(5, Math.min(...waits, appConfig.polling.liveMaxSeconds));
	return {
		fetchLive,
		fetchFixtures,
		fetchStandings,
		fullCalendar: opts.full,
		sleepSeconds,
		matchDay: opts.matchDay,
		liveCount: opts.liveCount
	};
}

function due(last: string | null, everySeconds: number, now: Date): boolean {
	if (!Number.isFinite(everySeconds)) return false;
	if (!last) return true;
	return now.getTime() - new Date(last).getTime() >= everySeconds * 1000;
}

function remaining(last: string | null, everySeconds: number, now: Date): number {
	if (!Number.isFinite(everySeconds)) return Number.POSITIVE_INFINITY;
	if (!last) return 0;
	return Math.max(0, everySeconds - (now.getTime() - new Date(last).getTime()) / 1000);
}

export function livePollJitterSeconds(): number {
	const min = appConfig.polling.liveMinSeconds;
	const max = appConfig.polling.liveMaxSeconds;
	return min + Math.floor(Math.random() * (max - min + 1));
}

/** First-class matches without end_at cover start day plus three more London days. */
export function matchCoversLondonDate(
	startAt: string,
	endAt: string | null,
	format: string,
	today: string
): boolean {
	const start = londonDateKey(startAt);
	let end = endAt ? londonDateKey(endAt) : start;
	if (!endAt && format === 'first-class') {
		const shifted = new Date(startAt);
		shifted.setUTCDate(shifted.getUTCDate() + 3);
		end = londonDateKey(shifted.toISOString());
	}
	return today >= start && today <= end;
}
