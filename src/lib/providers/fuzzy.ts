import type { ProviderMatch } from './types.js';

export function londonDate(iso: string, timeZone = 'Europe/London'): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(iso));
}

export function matchKey(
	competitionId: string,
	homeTeamId: string,
	awayTeamId: string,
	startAt: string
): string {
	const teams = [homeTeamId, awayTeamId].sort().join(':');
	return `${competitionId}|${londonDate(startAt)}|${teams}`;
}

function dayShift(iso: string, days: number): string {
	const date = new Date(iso);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString();
}

export function fuzzyMatchExisting(
	incoming: Pick<
		ProviderMatch,
		'competitionId' | 'homeTeamId' | 'awayTeamId' | 'startAt' | 'externalId'
	>,
	existing: Array<{
		id: string;
		sourceKey: string | null;
		competitionId: string;
		homeTeamId: string;
		awayTeamId: string;
		startAt: string;
	}>,
	windowDays = 3
): string | null {
	const bySource = existing.find((row) => row.sourceKey === incoming.externalId);
	if (bySource) return bySource.id;
	const exact = incoming.competitionId
		? matchKey(incoming.competitionId, incoming.homeTeamId, incoming.awayTeamId, incoming.startAt)
		: null;
	if (exact) {
		const hit = existing.find(
			(row) => matchKey(row.competitionId, row.homeTeamId, row.awayTeamId, row.startAt) === exact
		);
		if (hit) return hit.id;
	}
	const incomingTeams = new Set([incoming.homeTeamId, incoming.awayTeamId]);
	const start = new Date(incoming.startAt).getTime();
	const windowMs = windowDays * 24 * 60 * 60 * 1000;
	const candidates = existing.filter((row) => {
		if (row.competitionId !== incoming.competitionId) return false;
		const teams = new Set([row.homeTeamId, row.awayTeamId]);
		if (teams.size !== 2 || [...incomingTeams].some((id) => !teams.has(id))) return false;
		return Math.abs(new Date(row.startAt).getTime() - start) <= windowMs;
	});
	return candidates[0]?.id ?? null;
}

export function adjacentDates(iso: string, days: number): string[] {
	const out = [iso];
	for (let i = 1; i <= days; i++) {
		out.push(dayShift(iso, i), dayShift(iso, -i));
	}
	return out;
}
