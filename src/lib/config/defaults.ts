import { competitions } from './competitions.js';
import { groupForTeam } from './competitions.js';

export function isCompetitionId(value: string | null | undefined): value is string {
	return Boolean(value && competitions.some((competition) => competition.id === value));
}

export function defaultCompetitionId(
	cookieValue: string | null | undefined,
	favouriteCountyId: string | null
): string {
	if (cookieValue === 'all') return 'all';
	if (isCompetitionId(cookieValue)) return cookieValue;
	if (favouriteCountyId) return 'championship';
	return 'all';
}

export function defaultGroupId(competitionId: string, favouriteCountyId: string | null): string {
	const competition = competitions.find((item) => item.id === competitionId);
	if (!competition) return competitions[0].groups[0].id;
	if (favouriteCountyId) {
		const grouped = groupForTeam(competitionId, favouriteCountyId);
		if (grouped) return grouped.groupId;
	}
	return competition.groups[0].id;
}
