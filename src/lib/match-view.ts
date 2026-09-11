import { competitionById } from './config/index.js';
import { ballsRemaining, formatScore, teamLabel } from './format.js';
import type { MatchSummary } from './match-types.js';

export function teamTotals(match: MatchSummary, teamId: string): number {
	return match.innings
		.filter((innings) => innings.battingTeamId === teamId)
		.reduce((sum, innings) => sum + innings.runs, 0);
}

export function currentInnings(match: MatchSummary) {
	return match.innings.at(-1) ?? null;
}

export function matchHeadline(match: MatchSummary): string {
	if (match.status === 'upcoming') {
		return `${teamLabel(match.homeTeamId, match.format)} vs ${teamLabel(match.awayTeamId, match.format)}`;
	}
	if (match.status === 'completed' && match.resultText) return match.resultText;
	const current = currentInnings(match);
	if (!current) {
		return `${teamLabel(match.homeTeamId, match.format)} vs ${teamLabel(match.awayTeamId, match.format)}`;
	}
	const batting = teamLabel(current.battingTeamId, match.format);
	return `${batting} ${formatScore(current.runs, current.wickets, current.declared)}`;
}

export function matchContext(match: MatchSummary): string {
	const competition = competitionById[match.competitionId];
	const group = competition?.groups.find((group) => group.id === match.groupId);
	const bits = [competition?.name ?? match.competitionId];
	if (group) bits.push(group.name);
	bits.push(match.venue);
	if (match.status === 'live' && match.format === 'first-class' && match.dayNumber) {
		bits.push(`Day ${match.dayNumber}${match.session ? ` · ${match.session}` : ''}`);
	}
	return bits.join(' · ');
}

export function chaseLine(match: MatchSummary): string | null {
	const current = currentInnings(match);
	if (!current || match.status !== 'live') return null;
	if (match.format === 'first-class') {
		const batting = current.battingTeamId;
		const other = batting === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
		const lead = teamTotals(match, batting) - teamTotals(match, other);
		const name = teamLabel(batting, match.format);
		if (lead >= 0) return `${name} lead by ${lead}`;
		return `${name} trail by ${Math.abs(lead)}`;
	}
	if (match.targetRuns && match.targetBalls) {
		const need = match.targetRuns - current.runs;
		const balls = ballsRemaining(match.targetBalls, current.overs);
		if (need <= 0) return 'Target reached';
		return `Need ${need} from ${balls} ball${balls === 1 ? '' : 's'}`;
	}
	return null;
}
