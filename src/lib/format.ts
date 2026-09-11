import { competitionById, countyById } from './config/index.js';

export function teamLabel(teamId: string, format: 'first-class' | 't20' | 'lista'): string {
	const county = countyById[teamId];
	if (!county) return teamId;
	return format === 't20' ? county.blastName : county.shortName;
}

export function competitionLabel(competitionId: string, groupId: string | null): string {
	const competition = competitionById[competitionId];
	if (!competition) return competitionId;
	if (!groupId) return competition.name;
	const group = competition.groups.find((group) => group.id === groupId);
	return group ? `${competition.name} · ${group.name}` : competition.name;
}

export function formatOvers(overs: string): string {
	return `${overs} ov`;
}

export function formatScore(runs: number, wickets: number, declared: boolean): string {
	if (wickets >= 10) return String(runs);
	return `${runs}/${wickets}${declared ? 'd' : ''}`;
}

export function formatWhen(iso: string, timeZone = 'Europe/London'): string {
	const date = new Date(iso);
	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
		timeZone
	}).format(date);
}

export function formatDay(iso: string, timeZone = 'Europe/London'): string {
	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		timeZone
	}).format(new Date(iso));
}

export function relativeUpdated(iso: string, now = new Date()): string {
	const then = new Date(iso).getTime();
	const delta = Math.max(0, now.getTime() - then);
	const minutes = Math.round(delta / 60000);
	if (minutes < 1) return 'just now';
	if (minutes === 1) return '1 min ago';
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return formatWhen(iso);
}

export function oversToBalls(overs: string): number {
	const [whole, extra = '0'] = overs.split('.');
	return Number(whole) * 6 + Number(extra);
}

export function ballsRemaining(targetBalls: number, oversFaced: string): number {
	return Math.max(0, targetBalls - oversToBalls(oversFaced));
}
