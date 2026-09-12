import { counties } from '../config/counties.js';
import { groupForTeam } from '../config/competitions.js';

const byAbbreviation = new Map(
	counties.map((county) => [county.abbreviation.toUpperCase(), county.id])
);

export function countyIdFromEspnTeam(team: {
	abbreviation?: string | null;
	name?: string | null;
	displayName?: string | null;
}): string | null {
	const abbr = (team.abbreviation ?? '').toUpperCase().trim();
	if (abbr && byAbbreviation.has(abbr)) return byAbbreviation.get(abbr) ?? null;
	const blob = `${team.name ?? ''} ${team.displayName ?? ''}`.toLowerCase();
	if (!blob.trim()) return null;
	for (const county of counties) {
		const needles = [county.name, county.shortName, county.blastName].map((item) =>
			item.toLowerCase()
		);
		if (needles.some((needle) => needle.length > 3 && blob.includes(needle))) {
			return county.id;
		}
	}
	return null;
}

export function groupIdForMatch(
	competitionId: string,
	configuredGroupId: string | null,
	homeTeamId: string,
	awayTeamId: string,
	description: string | null
): string | null {
	if (configuredGroupId) return configuredGroupId;
	const fromDescription = groupFromDescription(competitionId, description);
	if (fromDescription) return fromDescription;
	return (
		groupForTeam(competitionId, homeTeamId)?.groupId ??
		groupForTeam(competitionId, awayTeamId)?.groupId ??
		null
	);
}

export function groupFromDescription(
	competitionId: string,
	description: string | null
): string | null {
	if (!description) return null;
	const text = description.toLowerCase();
	if (competitionId === 'blast') {
		if (text.includes('north group')) return 'group-a';
		if (text.includes('central') || text.includes('west group')) return 'group-b';
		if (text.includes('south group')) return 'group-c';
	}
	if (competitionId === 'one-day-cup') {
		if (/\bgroup a\b/.test(text)) return 'group-a';
		if (/\bgroup b\b/.test(text)) return 'group-b';
	}
	return null;
}

export function parseRound(
	description: string | null
): 'quarter-final' | 'semi-final' | 'final' | null {
	if (!description) return null;
	const text = description.toLowerCase();
	if (/quarter[- ]?final/.test(text)) return 'quarter-final';
	if (/semi[- ]?final/.test(text)) return 'semi-final';
	if (/(^|[,(]\s*)final\b/.test(text) || /\bfinal \(/.test(text)) return 'final';
	return null;
}
