import { appConfig } from '../config/index.js';

export type FreshnessStatus = 'seed' | 'ok' | 'delayed' | 'unavailable';

export type FreshnessSnapshot = {
	status: FreshnessStatus;
	ingestEnabled: boolean;
	source: string;
	updatedAt: string | null;
	ageSeconds: number | null;
	liveUpdatedAt: string | null;
	fixturesUpdatedAt: string | null;
	standingsUpdatedAt: string | null;
	staleMatches: number;
	liveCount: number;
	message: string;
};

export function ageSeconds(iso: string | null, now = new Date()): number | null {
	if (!iso) return null;
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return null;
	return Math.max(0, Math.round((now.getTime() - then) / 1000));
}

export function classifyFreshness(opts: {
	ingestEnabled: boolean;
	source: string | null;
	updatedAt: string | null;
	liveCount: number;
	now?: Date;
}): { status: FreshnessStatus; ageSeconds: number | null } {
	const age = ageSeconds(opts.updatedAt, opts.now);
	if (!opts.ingestEnabled) {
		return { status: 'seed', ageSeconds: age };
	}
	if (age == null) return { status: 'unavailable', ageSeconds: null };
	if (opts.liveCount > 0) {
		if (age > appConfig.freshness.unavailableSeconds)
			return { status: 'unavailable', ageSeconds: age };
		if (age > appConfig.freshness.delayedSeconds) return { status: 'delayed', ageSeconds: age };
		return { status: 'ok', ageSeconds: age };
	}
	if (age > appConfig.polling.standingsIdleSeconds) return { status: 'delayed', ageSeconds: age };
	return { status: 'ok', ageSeconds: age };
}

export function freshnessMessage(snapshot: Omit<FreshnessSnapshot, 'message'>): string {
	if (snapshot.status === 'seed') {
		return 'Scores come from local SQLite seed. Live ESPN ingest is off.';
	}
	if (snapshot.status === 'delayed') {
		return `Scores delayed — last good update ${Math.round((snapshot.ageSeconds ?? 0) / 60)} min ago.`;
	}
	if (snapshot.status === 'unavailable') {
		return 'Live scores unavailable. Last good data was kept; nothing newer was written.';
	}
	return 'Live scores from ESPNCricinfo JSON ingest.';
}

export function assembleFreshness(
	partial: Omit<FreshnessSnapshot, 'status' | 'ageSeconds' | 'message'> & {
		ingestEnabled: boolean;
		liveCount: number;
		now?: Date;
	}
): FreshnessSnapshot {
	const updatedAt =
		partial.liveCount > 0 ? (partial.liveUpdatedAt ?? partial.updatedAt) : partial.updatedAt;
	const classified = classifyFreshness({
		ingestEnabled: partial.ingestEnabled,
		source: partial.source,
		updatedAt,
		liveCount: partial.liveCount,
		now: partial.now
	});
	const snapshot = {
		...partial,
		updatedAt,
		status: classified.status,
		ageSeconds: classified.ageSeconds,
		message: ''
	};
	snapshot.message = freshnessMessage(snapshot);
	return snapshot;
}

export function logFreshnessAlerts(snapshot: FreshnessSnapshot): void {
	if (snapshot.status !== 'delayed' && snapshot.status !== 'unavailable') return;
	console.warn(`[county-cricket-live] health ${snapshot.status}: ${snapshot.message}`);
}
