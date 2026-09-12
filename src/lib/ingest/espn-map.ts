import { counties, groupForTeam } from '../config/index.js';
import type { SeriesEntry } from '../config/schema.js';
import type {
	MatchFormat,
	MatchStatus,
	ProviderInningsDetail,
	ProviderMatchDetail,
	ProviderStandingRow
} from '../providers/types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | null {
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function num(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value !== '' && Number.isFinite(Number(value))) {
		return Number(value);
	}
	return null;
}

const countyByAbbreviation = new Map(counties.map((county) => [county.abbreviation, county.id]));
const countyByName = new Map(
	counties.flatMap((county) => [
		[county.name.toLowerCase(), county.id],
		[county.shortName.toLowerCase(), county.id],
		[county.blastName.toLowerCase(), county.id]
	])
);

export function countyIdFromEspnTeam(team: unknown): string | null {
	if (!isRecord(team)) return null;
	const abbreviation = str(team.abbreviation)?.toUpperCase();
	if (abbreviation && countyByAbbreviation.has(abbreviation)) {
		return countyByAbbreviation.get(abbreviation) ?? null;
	}
	for (const key of ['name', 'displayName', 'shortDisplayName', 'nickname'] as const) {
		const name = str(team[key])?.toLowerCase();
		if (name && countyByName.has(name)) return countyByName.get(name) ?? null;
	}
	return null;
}

export function formatOversValue(value: unknown): string {
	const n = num(value);
	if (n === null) {
		const raw = str(value);
		return raw ?? '0';
	}
	if (Number.isInteger(n)) return `${n}.0`;
	return String(n);
}

export function mapMatchStatus(state: string | null, summary: string | null): MatchStatus {
	const s = (state ?? '').toLowerCase();
	const text = (summary ?? '').toLowerCase();
	if (s === 'pre') return 'upcoming';
	if (s === 'in') return 'live';
	if (/abandon|no result|cancelled|canceled|washed out/.test(text)) return 'abandoned';
	return 'completed';
}

function statMap(source: unknown): Record<string, number | string> {
	const out: Record<string, number | string> = {};
	if (!isRecord(source)) return out;
	const categories = asArray(source.categories);
	for (const category of categories) {
		if (!isRecord(category)) continue;
		for (const stat of asArray(category.stats)) {
			if (!isRecord(stat)) continue;
			const name = str(stat.name);
			if (!name) continue;
			const value = stat.value ?? stat.displayValue;
			if (typeof value === 'number' || typeof value === 'string') out[name] = value;
		}
	}
	return out;
}

function inningsFromLinescore(
	linescore: Record<string, unknown>,
	battingTeamId: string
): ProviderInningsDetail | null {
	if (linescore.isBatting === false) return null;
	const number = num(linescore.period) ?? num(linescore.value);
	if (number === null) return null;
	const runs = num(linescore.runs) ?? 0;
	const wickets = num(linescore.wickets) ?? 0;
	const description = str(linescore.description) ?? '';
	const declared = /decl/i.test(description);
	const stats = statMap(linescore.statistics);
	return {
		number,
		battingTeamId,
		runs,
		wickets,
		overs: formatOversValue(linescore.overs),
		declared,
		byes: num(stats.byes) ?? 0,
		legByes: num(stats.legbyes) ?? 0,
		wides: num(stats.wides) ?? 0,
		noBalls: num(stats.noballs) ?? 0,
		penalties: num(stats.oldPenaltyOrBonus) ?? num(stats.penalties) ?? 0,
		batting: [],
		bowling: [],
		fow: []
	};
}

function competitorOf(event: Record<string, unknown>, homeAway: 'home' | 'away') {
	const competitions = asArray(event.competitions);
	const competition = isRecord(competitions[0]) ? competitions[0] : event;
	return asArray(isRecord(competition) ? competition.competitors : []).find(
		(item) => isRecord(item) && item.homeAway === homeAway
	);
}

function venueName(event: Record<string, unknown>): string {
	const competitions = asArray(event.competitions);
	const competition = isRecord(competitions[0]) ? competitions[0] : null;
	const venue = isRecord(competition?.venue) ? competition.venue : null;
	return str(venue?.fullName) ?? str(venue?.shortName) ?? 'Unknown ground';
}

function eventStatus(event: Record<string, unknown>): {
	state: string | null;
	summary: string | null;
	period: number | null;
} {
	const competitions = asArray(event.competitions);
	const competition = isRecord(competitions[0]) ? competitions[0] : null;
	const status = isRecord(event.status)
		? event.status
		: isRecord(competition?.status)
			? competition.status
			: null;
	const type = isRecord(status?.type) ? status.type : null;
	return {
		state: str(type?.state),
		summary: str(status?.summary) ?? str(type?.detail),
		period: num(status?.period)
	};
}

export function parseScoreboardEvent(
	event: unknown,
	series: SeriesEntry,
	format: MatchFormat
): ProviderMatchDetail | null {
	if (!isRecord(event)) return null;
	const id = str(event.id);
	if (!id) return null;
	const home = competitorOf(event, 'home');
	const away = competitorOf(event, 'away');
	if (!isRecord(home) || !isRecord(away)) return null;
	const homeTeamId = countyIdFromEspnTeam(home.team);
	const awayTeamId = countyIdFromEspnTeam(away.team);
	if (!homeTeamId || !awayTeamId) return null;

	const grouped = groupForTeam(series.competitionId, homeTeamId);
	const groupId = grouped?.groupId ?? series.groupId;

	const innings: ProviderInningsDetail[] = [];
	for (const competitor of [home, away]) {
		const teamId = countyIdFromEspnTeam(isRecord(competitor.team) ? competitor.team : null);
		if (!teamId) continue;
		for (const linescore of asArray(competitor.linescores)) {
			if (!isRecord(linescore)) continue;
			const inningsRow = inningsFromLinescore(linescore, teamId);
			if (inningsRow) innings.push(inningsRow);
		}
	}
	innings.sort((a, b) => a.number - b.number);

	const followOn = [home, away].some((competitor) =>
		asArray(competitor.linescores).some(
			(linescore) =>
				isRecord(linescore) && (linescore.followOn === 1 || linescore.followOn === true)
		)
	);

	const { state, summary, period } = eventStatus(event);
	const status = mapMatchStatus(state, summary);
	const startAt = str(event.date) ?? new Date().toISOString();
	const endAt = str(event.endDate);

	let targetRuns: number | null = null;
	let targetBalls: number | null = null;
	if (format !== 'first-class' && innings.length >= 1) {
		targetRuns = innings[0].runs + 1;
		targetBalls = format === 't20' ? 120 : 300;
	}

	return {
		externalId: id,
		competitionId: series.competitionId,
		groupId,
		homeTeamId,
		awayTeamId,
		venue: venueName(event),
		startAt,
		endAt: status === 'upcoming' ? null : (endAt ?? null),
		status,
		format,
		resultText: status === 'upcoming' || status === 'live' ? null : summary,
		dayNumber: format === 'first-class' ? period : null,
		session: null,
		followOn,
		targetRuns,
		targetBalls,
		tossWinnerId: null,
		tossDecision: null,
		innings,
		hasScorecard: false
	};
}

export function parseScoreboardEvents(
	payload: unknown,
	series: SeriesEntry,
	format: MatchFormat
): ProviderMatchDetail[] {
	if (!isRecord(payload)) return [];
	const seen = new Set<string>();
	const matches: ProviderMatchDetail[] = [];
	for (const event of asArray(payload.events)) {
		const match = parseScoreboardEvent(event, series, format);
		if (!match || seen.has(match.externalId)) continue;
		seen.add(match.externalId);
		matches.push(match);
	}
	return matches;
}

function statNumber(stats: Record<string, number | string>, name: string): number {
	return num(stats[name]) ?? 0;
}

function mapDismissal(card: string | null, notOut: boolean): string {
	if (notOut) return 'not out';
	const code = (card ?? '').toLowerCase();
	if (code === 'c' || code === 'ct' || code === 'caught') return 'caught';
	if (code === 'b' || code === 'bowled') return 'bowled';
	if (code === 'lbw') return 'lbw';
	if (code === 'st' || code === 'stumped') return 'stumped';
	if (code === 'ro' || code === 'run out') return 'run out';
	if (code === 'hw' || code === 'hit wicket') return 'hit wicket';
	if (code === 'no' || code === 'not out') return 'not out';
	if (!code) return 'not out';
	return code;
}

function playerName(athlete: Record<string, unknown>): string {
	return (
		str(athlete.battingName) ??
		str(athlete.fieldingName) ??
		str(athlete.displayName) ??
		str(athlete.fullName) ??
		'Unknown'
	);
}

export function applySummaryToMatch(
	match: ProviderMatchDetail,
	summary: unknown
): ProviderMatchDetail {
	if (!isRecord(summary)) return match;
	const header = isRecord(summary.header) ? summary.header : null;
	const competitions = asArray(header?.competitions);
	const competition = isRecord(competitions[0]) ? competitions[0] : null;
	const status = isRecord(competition?.status) ? competition.status : null;
	const type = isRecord(status?.type) ? status.type : null;
	const summaryText = str(status?.summary);
	const next: ProviderMatchDetail = {
		...match,
		status: mapMatchStatus(str(type?.state) ?? match.status, summaryText),
		resultText:
			match.status === 'upcoming' || str(type?.state) === 'pre' || str(type?.state) === 'in'
				? match.resultText
				: (summaryText ?? match.resultText),
		dayNumber: num(status?.period) ?? match.dayNumber,
		venue: match.venue
	};

	if (isRecord(summary.gameInfo) && isRecord(summary.gameInfo.venue)) {
		next.venue = str(summary.gameInfo.venue.fullName) ?? match.venue;
	}

	for (const note of asArray(summary.notes)) {
		if (!isRecord(note)) continue;
		if (note.type === 'toss') {
			const text = str(note.text) ?? '';
			const elected = text.match(/elected to (bat|field|bowl)/i);
			if (elected) {
				next.tossDecision = elected[1].toLowerCase() === 'bat' ? 'bat' : 'bowl';
			}
			const who = text
				.split(',')[0]
				?.replace(/elected.*$/i, '')
				.trim();
			if (who) {
				const id = countyByName.get(who.toLowerCase());
				if (id) next.tossWinnerId = id;
			}
		}
	}

	const inningsByNumber = new Map(next.innings.map((innings) => [innings.number, { ...innings }]));

	for (const roster of asArray(summary.rosters)) {
		if (!isRecord(roster)) continue;
		const teamId = countyIdFromEspnTeam(roster.team);
		if (!teamId) continue;
		for (const player of asArray(roster.roster)) {
			if (!isRecord(player) || !isRecord(player.athlete)) continue;
			const name = playerName(player.athlete);
			for (const period of asArray(player.linescores)) {
				if (!isRecord(period)) continue;
				for (const line of asArray(period.linescores)) {
					if (!isRecord(line)) continue;
					const stats = statMap(line.statistics);
					const inningsNumber = statNumber(stats, 'inningsNumber') || num(period.period) || 0;
					const battingStats = isRecord(line.statistics) ? line.statistics.batting : null;
					const batted = statNumber(stats, 'batted') > 0 || statNumber(stats, 'ballsFaced') > 0;
					if (batted && inningsNumber) {
						const innings = inningsByNumber.get(inningsNumber);
						if (innings && innings.battingTeamId === teamId) {
							const outDetails = isRecord(battingStats) ? battingStats?.outDetails : null;
							const bowler =
								isRecord(outDetails) && isRecord(outDetails.bowler)
									? str(outDetails.bowler.displayName)
									: null;
							const fielderEntry = isRecord(outDetails) ? asArray(outDetails.fielders)[0] : null;
							const fielder =
								isRecord(fielderEntry) && isRecord(fielderEntry.athlete)
									? str(fielderEntry.athlete.displayName)
									: null;
							const notOut = statNumber(stats, 'notouts') > 0;
							const order = statNumber(stats, 'battingPosition') || innings.batting.length + 1;
							innings.batting.push({
								battingOrder: order,
								playerName: name,
								runs: statNumber(stats, 'runs'),
								balls: statNumber(stats, 'ballsFaced'),
								fours: statNumber(stats, 'fours'),
								sixes: statNumber(stats, 'sixes'),
								dismissal: mapDismissal(str(stats.dismissalCard), notOut),
								dismissedBy: notOut ? null : bowler,
								fielder: fielder,
								isStriker: Boolean(isRecord(battingStats) && battingStats.active),
								isNonStriker: false
							});
						}
					}
					const bowled = statNumber(stats, 'inningsBowled') > 0 || statNumber(stats, 'overs') > 0;
					if (bowled && inningsNumber) {
						const innings = inningsByNumber.get(inningsNumber);
						if (innings && innings.battingTeamId !== teamId) {
							innings.bowling.push({
								bowlingOrder: statNumber(stats, 'bowlingPosition') || innings.bowling.length + 1,
								playerName: name,
								overs: formatOversValue(stats.overs),
								maidens: statNumber(stats, 'maidens'),
								runs: statNumber(stats, 'conceded'),
								wickets: statNumber(stats, 'wickets')
							});
						}
					}
				}
			}
		}
	}

	for (const innings of inningsByNumber.values()) {
		innings.batting.sort((a, b) => a.battingOrder - b.battingOrder);
		innings.bowling.sort((a, b) => a.bowlingOrder - b.bowlingOrder);
		const hasCard = innings.batting.length > 0 || innings.bowling.length > 0;
		if (hasCard) next.hasScorecard = true;
	}
	next.innings = [...inningsByNumber.values()].sort((a, b) => a.number - b.number);
	if (next.format !== 'first-class' && next.innings.length >= 1) {
		next.targetRuns = next.innings[0].runs + 1;
		next.targetBalls = next.format === 't20' ? 120 : 300;
	}
	return next;
}

function standingStat(stats: unknown[], name: string): number {
	const row = stats.find((item) => isRecord(item) && item.name === name);
	return isRecord(row) ? (num(row.value) ?? 0) : 0;
}

function standingStatOpt(stats: unknown[], name: string): number | null {
	const row = stats.find((item) => isRecord(item) && item.name === name);
	if (!isRecord(row)) return null;
	return num(row.value);
}

export function parseStandingsPayload(
	payload: unknown,
	series: SeriesEntry
): ProviderStandingRow[] {
	if (!isRecord(payload)) return [];
	const rows: ProviderStandingRow[] = [];
	for (const child of asArray(payload.children)) {
		if (!isRecord(child)) continue;
		const name = (str(child.name) ?? '').toLowerCase();
		if (name.includes('cross pool')) continue;
		const standings = isRecord(child.standings) ? child.standings : null;
		const entries = asArray(standings?.entries);
		if (entries.length === 18 && series.competitionId === 'blast') continue;
		for (const entry of entries) {
			if (!isRecord(entry)) continue;
			const teamId = countyIdFromEspnTeam(entry.team);
			if (!teamId) continue;
			const grouped = groupForTeam(series.competitionId, teamId);
			const groupId = grouped?.groupId ?? series.groupId;
			if (!groupId) continue;
			const stats = asArray(entry.stats);
			rows.push({
				competitionId: series.competitionId,
				groupId,
				teamId,
				played: standingStat(stats, 'matchesPlayed'),
				won: standingStat(stats, 'matchesWon'),
				lost: standingStat(stats, 'matchesLost'),
				drawn: standingStat(stats, 'matchesDraw'),
				tied: standingStat(stats, 'matchesTied'),
				noResult: standingStat(stats, 'noresult'),
				battingBonus: standingStat(stats, 'battingBonus'),
				bowlingBonus: standingStat(stats, 'bowlingBonus'),
				points: standingStat(stats, 'matchPoints'),
				deducted: standingStat(stats, 'deducted'),
				netRunRate: standingStatOpt(stats, 'netrr')
			});
		}
	}
	return rows;
}

export function ymdUTC(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${year}${month}${day}`;
}

export function nearbyScoreboardDates(now = new Date(), padBefore = 4, padAfter = 2): string[] {
	const dates: string[] = [];
	for (let offset = -padBefore; offset <= padAfter; offset++) {
		const date = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset)
		);
		dates.push(ymdUTC(date));
	}
	return dates;
}

export function seasonWalkDates(season: number): string[] {
	const dates: string[] = [];
	const start = Date.UTC(season, 3, 1);
	const end = Date.UTC(season, 8, 30);
	for (let time = start; time <= end; time += 24 * 60 * 60 * 1000) {
		const date = new Date(time);
		const month = date.getUTCMonth();
		const day = date.getUTCDay();
		const ymd = ymdUTC(date);
		if (day === 5) dates.push(ymd);
		else if (month >= 4 && month <= 7) {
			if (day === 2 || day === 0) dates.push(ymd);
		} else if (month === 8 && (day === 0 || day === 2 || day === 4)) {
			dates.push(ymd);
		}
	}
	return dates;
}
