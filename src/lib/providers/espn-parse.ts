import { appConfig } from '../config/index.js';
import type {
	MatchRound,
	MatchStatus,
	ParseResult,
	ProviderBatter,
	ProviderBowler,
	ProviderFow,
	ProviderInnings,
	ProviderMatch,
	ProviderScorecardInnings,
	ProviderStanding
} from './types.js';
import { countyIdFromEspnTeam, groupIdForMatch, parseRound } from './espn-teams.js';

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json | null {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Json)
		: null;
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function str(value: unknown): string {
	if (value == null) return '';
	return String(value);
}

function num(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '' && value !== '-') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function boolish(value: unknown): boolean {
	return value === true || value === 1 || value === 'true' || value === '1';
}

function decodeEntities(value: string): string {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function leagueByEspnId(espnId: string) {
	return appConfig.espn.leagues.find((league) => league.espnId === espnId) ?? null;
}

export function espnLeagueFor(competitionId: string, groupId: string | null) {
	return (
		appConfig.espn.leagues.find(
			(league) => league.competitionId === competitionId && league.groupId === groupId
		) ??
		appConfig.espn.leagues.find(
			(league) => league.competitionId === competitionId && league.groupId == null
		) ??
		null
	);
}

export function mapMatchStatus(summary: string, state: string, description: string): MatchStatus {
	const blob = `${summary} ${description} ${state}`.toLowerCase();
	if (/abandon|washed out|no result without/.test(blob)) return 'abandoned';
	if (state === 'pre' || /scheduled/.test(description.toLowerCase())) return 'upcoming';
	if (state === 'in' || /live|stumps|delay|rain|lunch|tea/.test(blob)) return 'live';
	if (state === 'post' || /result/.test(description.toLowerCase())) return 'completed';
	if (state === 'pre') return 'upcoming';
	return 'upcoming';
}

function oversString(value: unknown): string {
	if (typeof value === 'number') {
		if (Number.isInteger(value)) return `${value}.0`;
		return String(value);
	}
	const text = str(value).trim();
	return text || '0';
}

function isDeclared(description: string, score: string, total: string): boolean {
	const blob = `${description} ${score} ${total}`.toLowerCase();
	return /\bdeclared\b|\bdec\b|\/\d+d\b|\(wkts dec/.test(blob);
}

function parseTarget(
	score: string,
	format: ProviderMatch['format']
): {
	targetRuns: number | null;
	targetBalls: number | null;
} {
	const match = score.match(/target\s+(\d+)/i);
	if (!match) return { targetRuns: null, targetBalls: null };
	const targetRuns = Number(match[1]);
	const overs = score.match(/(\d+(?:\.\d+)?)\/(\d+)\s*ov/i);
	const targetBalls =
		format === 't20' ? 120 : format === 'lista' ? 300 : overs ? Number(overs[2]) * 6 : null;
	return { targetRuns, targetBalls };
}

export function inningsFromLinescores(
	homeTeamId: string,
	awayTeamId: string,
	competitors: Json[]
): { innings: ProviderInnings[]; followOn: boolean } {
	const byTeam = new Map<string, Json[]>();
	for (const competitor of competitors) {
		const team = asRecord(competitor.team) ?? {};
		const teamId = countyIdFromEspnTeam(team);
		if (!teamId) continue;
		byTeam.set(
			teamId,
			asArray(competitor.linescores).map((row) => asRecord(row) ?? {})
		);
	}
	const periods = new Set<number>();
	for (const lines of byTeam.values()) {
		for (const line of lines) {
			const period = num(line.period);
			if (period) periods.add(period);
		}
	}
	const innings: ProviderInnings[] = [];
	for (const period of [...periods].sort((a, b) => a - b)) {
		let battingTeamId: string | null = null;
		let chosen: Json | null = null;
		for (const [teamId, lines] of byTeam) {
			const line = lines.find((item) => num(item.period) === period);
			if (!line) continue;
			if (boolish(line.isBatting)) {
				battingTeamId = teamId;
				chosen = line;
				break;
			}
		}
		if (!battingTeamId || !chosen) continue;
		const runs = num(chosen.runs);
		const wickets = num(chosen.wickets);
		const overs = oversString(chosen.overs);
		const current = boolish(chosen.isCurrent);
		if (runs === 0 && wickets === 0 && overs === '0' && !current && innings.length === 0) {
			continue;
		}
		innings.push({
			number: innings.length + 1,
			battingTeamId,
			runs,
			wickets,
			overs,
			declared: isDeclared(str(chosen.description), '', '')
		});
	}
	const followOn = innings.length >= 3 && innings[1].battingTeamId === innings[2].battingTeamId;
	void homeTeamId;
	void awayTeamId;
	return { innings, followOn };
}

function extrasFromText(text: string): {
	byes: number;
	legByes: number;
	wides: number;
	noBalls: number;
	penalties: number;
} {
	const lower = text.toLowerCase();
	const grab = (keys: string[]) => {
		for (const key of keys) {
			const match = lower.match(new RegExp(`\\b${key}\\s+(\\d+)`));
			if (match) return Number(match[1]);
		}
		return 0;
	};
	return {
		byes: grab(['b', 'byes']),
		legByes: grab(['lb', 'leg-byes', 'leg byes']),
		wides: grab(['w', 'wd', 'wides']),
		noBalls: grab(['nb', 'no-balls', 'no balls']),
		penalties: grab(['pen', 'penalties'])
	};
}

function dayAndSession(
	summary: string,
	notes: Json[]
): {
	dayNumber: number | null;
	session: string | null;
} {
	const dayMatch = summary.match(/day\s+(\d+)/i);
	let dayNumber = dayMatch ? Number(dayMatch[1]) : null;
	let session: string | null = null;
	const lower = summary.toLowerCase();
	if (/stumps/.test(lower)) session = 'stumps';
	else if (/rain|delay/.test(lower)) session = 'rain';
	else if (/tea/.test(lower)) session = 'tea';
	else if (/lunch/.test(lower)) session = 'lunch';
	else if (/afternoon/.test(lower)) session = 'afternoon';
	else if (/morning/.test(lower)) session = 'morning';
	else if (/evening/.test(lower)) session = 'evening';
	if (dayNumber == null) {
		for (const note of notes) {
			if (str(note.type) !== 'closeofplay') continue;
			const n = num(note.dayNumber);
			if (n) dayNumber = n;
		}
	}
	return { dayNumber, session };
}

function tossFromNotes(notes: Json[]): {
	tossWinnerId: string | null;
	tossDecision: string | null;
} {
	const toss = notes.find((note) => str(note.type) === 'toss');
	if (!toss) return { tossWinnerId: null, tossDecision: null };
	const text = str(toss.text);
	const elected = /elected to (bat|bowl|field)/i.exec(text);
	const name = text
		.split(',')[0]
		?.replace(/elected.*$/i, '')
		.trim();
	const tossWinnerId = name
		? countyIdFromEspnTeam({ name, abbreviation: '', displayName: name })
		: null;
	let tossDecision: string | null = null;
	if (elected) {
		const verb = elected[1].toLowerCase();
		tossDecision = verb === 'field' ? 'bowl' : verb;
	}
	return { tossWinnerId, tossDecision };
}

export function parseScoreboard(
	payload: unknown,
	espnLeagueId: string
): ParseResult<ProviderMatch[]> {
	const root = asRecord(payload);
	if (!root) return { ok: false, error: 'scoreboard is not an object' };
	const league = leagueByEspnId(espnIdFromPayload(root, espnLeagueId));
	if (!league) return { ok: false, error: `unknown ESPN league ${espnLeagueId}` };
	const events = asArray(root.events);
	const matches: ProviderMatch[] = [];
	const errors: string[] = [];
	for (const event of events) {
		const parsed = parseScoreboardEvent(event, league.espnId);
		if (parsed.ok) matches.push(parsed.value);
		else errors.push(parsed.error);
	}
	if (!matches.length && events.length) {
		return { ok: false, error: errors.join('; ') || 'no events parsed' };
	}
	return { ok: true, value: matches };
}

function espnIdFromPayload(root: Json, fallback: string): string {
	const leagues = asArray(root.leagues);
	const first = asRecord(leagues[0]);
	return str(first?.id || fallback);
}

export function parseScoreboardEvent(
	event: unknown,
	espnLeagueId: string
): ParseResult<ProviderMatch> {
	const league = leagueByEspnId(espnLeagueId);
	if (!league) return { ok: false, error: `unknown ESPN league ${espnLeagueId}` };
	const row = asRecord(event);
	if (!row) return { ok: false, error: 'event is not an object' };
	const competition = asRecord(asArray(row.competitions)[0]) ?? row;
	const competitors = asArray(competition.competitors ?? row.teams).map(
		(item) => asRecord(item) ?? {}
	);
	if (competitors.length < 2) return { ok: false, error: `event ${str(row.id)} missing teams` };
	const home = competitors.find((item) => str(item.homeAway) === 'home') ?? competitors[0];
	const away = competitors.find((item) => str(item.homeAway) === 'away') ?? competitors[1];
	const homeTeamId = countyIdFromEspnTeam(asRecord(home.team) ?? {});
	const awayTeamId = countyIdFromEspnTeam(asRecord(away.team) ?? {});
	if (!homeTeamId || !awayTeamId) {
		return { ok: false, error: `event ${str(row.id)} has unmapped county teams` };
	}
	const status = asRecord(row.status) ?? asRecord(competition.status) ?? {};
	const statusType = asRecord(status.type) ?? {};
	const summary = decodeEntities(str(status.summary));
	const description = str(row.description);
	const matchStatus = mapMatchStatus(summary, str(statusType.state), str(statusType.description));
	const { innings, followOn } = inningsFromLinescores(homeTeamId, awayTeamId, competitors);
	const scoreAway = str(away.score);
	const scoreHome = str(home.score);
	const target =
		parseTarget(scoreAway, league.format).targetRuns != null
			? parseTarget(scoreAway, league.format)
			: parseTarget(scoreHome, league.format);
	const notes = asArray(competition.notes).map((item) => asRecord(item) ?? {});
	const { dayNumber, session } = dayAndSession(summary, notes);
	const toss = tossFromNotes(notes);
	const venue = asRecord(competition.venue);
	const followOnFromScore = /\(f\/o\)/i.test(`${scoreHome} ${scoreAway}`);
	const round = parseRound(description);
	const startAt = str(competition.date || row.date);
	if (!startAt) return { ok: false, error: `event ${str(row.id)} missing date` };
	return {
		ok: true,
		value: {
			externalId: str(row.id || competition.id),
			competitionId: league.competitionId,
			groupId: groupIdForMatch(
				league.competitionId,
				league.groupId,
				homeTeamId,
				awayTeamId,
				description
			),
			homeTeamId,
			awayTeamId,
			venue: str(venue?.fullName) || 'Unknown ground',
			startAt: normaliseIso(startAt),
			endAt: str(competition.endDate || row.endDate) || null,
			status: matchStatus,
			format: league.format,
			round: (round ?? (league.format === 'first-class' ? null : 'group')) as MatchRound | null,
			resultText: matchStatus === 'upcoming' ? null : summary || null,
			followOn: followOn || followOnFromScore,
			targetRuns: target.targetRuns,
			targetBalls: target.targetBalls,
			tossWinnerId: toss.tossWinnerId,
			tossDecision: toss.tossDecision,
			dayNumber,
			session,
			innings,
			scorecard: null
		}
	};
}

function normaliseIso(value: string): string {
	if (/Z$/.test(value) || /[+-]\d\d:\d\d$/.test(value)) return new Date(value).toISOString();
	if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(`${value}Z`).toISOString();
	return new Date(value).toISOString();
}

export function parseCompactFixture(event: {
	id: string;
	leagueId: string;
	date?: string | null;
	endDate?: string | null;
	name?: string | null;
	description?: string | null;
	summary?: string | null;
	state?: string | null;
	statusDescription?: string | null;
	venue?: string | null;
	teams: Array<{
		abbreviation?: string | null;
		name?: string | null;
		homeAway?: string | null;
		winner?: string | boolean | null;
		score?: string | null;
		linescores?: unknown[];
	}>;
}): ParseResult<ProviderMatch> {
	const reconstructed = {
		id: event.id,
		date: event.date,
		endDate: event.endDate,
		name: event.name,
		description: event.description,
		status: {
			summary: event.summary,
			type: { state: event.state, description: event.statusDescription }
		},
		competitions: [
			{
				date: event.date,
				endDate: event.endDate,
				venue: { fullName: event.venue },
				status: {
					summary: event.summary,
					type: { state: event.state, description: event.statusDescription }
				},
				competitors: event.teams.map((team) => ({
					homeAway: team.homeAway,
					winner: team.winner,
					score: team.score,
					team: { abbreviation: team.abbreviation, name: team.name, displayName: team.name },
					linescores: team.linescores ?? []
				}))
			}
		]
	};
	return parseScoreboardEvent(reconstructed, event.leagueId);
}

function statMap(statistics: unknown): Map<string, string> {
	const map = new Map<string, string>();
	const root = asRecord(statistics);
	for (const category of asArray(root?.categories)) {
		const cat = asRecord(category);
		for (const row of asArray(cat?.stats)) {
			const item = asRecord(row) ?? {};
			map.set(str(item.name), str(item.displayValue || item.value));
		}
	}
	return map;
}

function dismissalLabel(card: string, dismissalCode: string): string {
	const value = (card || '').toLowerCase().trim();
	if (!value && dismissalCode === '0') return 'not out';
	const aliases: Record<string, string> = {
		c: 'caught',
		caught: 'caught',
		b: 'bowled',
		bowled: 'bowled',
		lbw: 'lbw',
		st: 'stumped',
		stumped: 'stumped',
		ro: 'run out',
		'run out': 'run out',
		hitw: 'hit wicket',
		'not out': 'not out',
		no: 'not out'
	};
	return aliases[value] ?? (value || 'not out');
}

export function parseSummaryScorecard(
	payload: unknown,
	base: ProviderMatch
): ParseResult<ProviderScorecardInnings[]> {
	const root = asRecord(payload);
	if (!root) return { ok: false, error: 'summary is not an object' };
	const header = asRecord(root.header) ?? {};
	const competition = asRecord(asArray(header.competitions)[0]);
	const notes = asArray(root.notes).map((item) => asRecord(item) ?? {});
	const toss = tossFromNotes(notes);
	if (toss.tossWinnerId) {
		base.tossWinnerId = toss.tossWinnerId;
		base.tossDecision = toss.tossDecision;
	}
	if (competition) {
		const status = asRecord(competition.status) ?? {};
		const summary = decodeEntities(str(status.summary));
		if (summary) base.resultText = summary;
		const { dayNumber, session } = dayAndSession(summary, notes);
		if (dayNumber) base.dayNumber = dayNumber;
		if (session) base.session = session;
	}

	const extrasByInnings = new Map<number, ReturnType<typeof extrasFromText>>();
	const fowByInnings = new Map<number, ProviderFow[]>();
	for (const card of asArray(root.matchcards)) {
		const row = asRecord(card) ?? {};
		const inningsNumber = num(row.inningsNumber);
		const headline = str(row.headline).toLowerCase();
		if (headline === 'batting' && row.extras) {
			extrasByInnings.set(inningsNumber, extrasFromText(str(row.extras)));
		}
		if (headline === 'partnerships') {
			const fow: ProviderFow[] = [];
			asArray(row.playerDetails).forEach((item, index) => {
				const partnership = asRecord(item) ?? {};
				const wicketName = str(partnership.partnershipWicketName);
				if (!wicketName && !str(partnership.partnershipRuns)) return;
				fow.push({
					wicketNumber: index + 1,
					runs: num(partnership.partnershipRuns),
					playerName: wicketName || str(partnership.player1Name),
					overs: str(partnership.partnershipOvers) || '0'
				});
			});
			fowByInnings.set(inningsNumber, fow);
		}
	}

	type Accumulator = {
		number: number;
		battingTeamId: string;
		runs: number;
		wickets: number;
		overs: string;
		declared: boolean;
		batting: ProviderBatter[];
		bowling: ProviderBowler[];
	};
	const inningsMap = new Map<number, Accumulator>();

	const ensure = (inningsNumber: number, battingTeamId: string): Accumulator => {
		const existing = inningsMap.get(inningsNumber);
		if (existing) return existing;
		const created: Accumulator = {
			number: inningsNumber,
			battingTeamId,
			runs: 0,
			wickets: 0,
			overs: '0',
			declared: false,
			batting: [],
			bowling: []
		};
		inningsMap.set(inningsNumber, created);
		return created;
	};

	for (const roster of asArray(root.rosters)) {
		const side = asRecord(roster) ?? {};
		const teamId = countyIdFromEspnTeam(asRecord(side.team) ?? {});
		if (!teamId) continue;
		for (const player of asArray(side.roster)) {
			const person = asRecord(player) ?? {};
			const athlete = asRecord(person.athlete) ?? {};
			const name = str(athlete.battingName || athlete.displayName || athlete.name);
			if (!name) continue;
			for (const period of asArray(person.linescores)) {
				const periodRow = asRecord(period) ?? {};
				for (const inner of asArray(periodRow.linescores)) {
					const stats = statMap(asRecord(inner)?.statistics);
					const inningsNumber = num(stats.get('inningsNumber') || periodRow.period);
					if (!inningsNumber) continue;
					const batted = stats.get('batted') === '1' || stats.has('ballsFaced');
					const bowled = num(stats.get('inningsBowled')) > 0 || num(stats.get('overs')) > 0;
					if (batted && stats.has('ballsFaced')) {
						const innings = ensure(inningsNumber, teamId);
						innings.batting.push({
							battingOrder: num(stats.get('battingPosition')) || innings.batting.length + 1,
							playerName: name,
							runs: num(stats.get('runs')),
							balls: num(stats.get('ballsFaced')),
							fours: num(stats.get('fours')),
							sixes: num(stats.get('sixes')),
							dismissal: dismissalLabel(
								str(stats.get('dismissalCard')),
								str(stats.get('dismissal'))
							),
							dismissedBy: null,
							fielder: null,
							isStriker: false,
							isNonStriker: false
						});
					}
					if (bowled) {
						const bowlingTeamId = teamId === base.homeTeamId ? base.awayTeamId : base.homeTeamId;
						const innings = inningsMap.get(inningsNumber) ?? ensure(inningsNumber, bowlingTeamId);
						if (!innings.battingTeamId) innings.battingTeamId = bowlingTeamId;
						innings.bowling.push({
							bowlingOrder: num(stats.get('bowlingPosition')) || innings.bowling.length + 1,
							playerName: name,
							overs: oversString(stats.get('overs')),
							maidens: num(stats.get('maidens')),
							runs: num(stats.get('conceded')),
							wickets: num(stats.get('wickets'))
						});
					}
				}
			}
		}
	}

	for (const innings of inningsMap.values()) {
		innings.batting.sort((a, b) => a.battingOrder - b.battingOrder);
		innings.bowling.sort((a, b) => a.bowlingOrder - b.bowlingOrder);
		innings.runs = innings.batting.reduce((sum, row) => sum + row.runs, 0);
		innings.wickets = innings.batting.filter(
			(row) => row.dismissal && row.dismissal !== 'not out' && row.dismissal !== ''
		).length;
	}

	for (const summaryInnings of base.innings) {
		const found = inningsMap.get(summaryInnings.number);
		if (found) {
			found.runs = summaryInnings.runs;
			found.wickets = summaryInnings.wickets;
			found.overs = summaryInnings.overs;
			found.declared = summaryInnings.declared;
			found.battingTeamId = summaryInnings.battingTeamId;
		} else {
			inningsMap.set(summaryInnings.number, {
				number: summaryInnings.number,
				battingTeamId: summaryInnings.battingTeamId,
				runs: summaryInnings.runs,
				wickets: summaryInnings.wickets,
				overs: summaryInnings.overs,
				declared: summaryInnings.declared,
				batting: [],
				bowling: []
			});
		}
	}

	const scorecard: ProviderScorecardInnings[] = [...inningsMap.values()]
		.sort((a, b) => a.number - b.number)
		.map((innings) => {
			const extras = extrasByInnings.get(innings.number) ?? {
				byes: 0,
				legByes: 0,
				wides: 0,
				noBalls: 0,
				penalties: 0
			};
			return {
				number: innings.number,
				battingTeamId: innings.battingTeamId,
				runs: innings.runs,
				wickets: innings.wickets,
				overs: innings.overs,
				declared: innings.declared,
				byes: extras.byes,
				legByes: extras.legByes,
				wides: extras.wides,
				noBalls: extras.noBalls,
				penalties: extras.penalties,
				batting: innings.batting,
				bowling: innings.bowling,
				fow: fowByInnings.get(innings.number) ?? []
			};
		});

	if (!scorecard.length)
		return { ok: false, error: `no scorecard innings in summary for ${base.externalId}` };
	const hasPlayers = scorecard.some(
		(innings) => innings.batting.length > 0 || innings.bowling.length > 0
	);
	if (!hasPlayers) {
		return {
			ok: false,
			error: `summary for ${base.externalId} had no batting/bowling rows`
		};
	}
	return { ok: true, value: scorecard };
}

function standingNumber(stats: Map<string, string>, names: string[]): number {
	for (const name of names) {
		if (stats.has(name)) return num(stats.get(name));
	}
	return 0;
}

export function parseStandings(
	payload: unknown,
	espnLeagueId: string
): ParseResult<ProviderStanding[]> {
	const league = leagueByEspnId(espnLeagueId);
	if (!league) return { ok: false, error: `unknown ESPN league ${espnLeagueId}` };
	const root = asRecord(payload);
	if (!root) return { ok: false, error: 'standings is not an object' };
	const rows: ProviderStanding[] = [];
	for (const child of asArray(root.children)) {
		const group = asRecord(child) ?? {};
		const name = str(group.name);
		if (/cross pool/i.test(name)) continue;
		const entries = asArray(asRecord(group.standings)?.entries);
		for (const entry of entries) {
			const item = asRecord(entry) ?? {};
			const teamId = countyIdFromEspnTeam(asRecord(item.team) ?? {});
			if (!teamId) continue;
			const stats = new Map<string, string>();
			for (const row of asArray(item.stats)) {
				const stat = asRecord(row) ?? {};
				stats.set(str(stat.name), str(stat.displayValue || stat.value));
			}
			const groupId =
				league.groupId ??
				groupIdForMatch(league.competitionId, null, teamId, teamId, name) ??
				'group-a';
			rows.push({
				competitionId: league.competitionId,
				groupId,
				teamId,
				played: standingNumber(stats, ['matchesPlayed']),
				won: standingNumber(stats, ['matchesWon']),
				lost: standingNumber(stats, ['matchesLost']),
				drawn: standingNumber(stats, ['matchesDraw']),
				tied: standingNumber(stats, ['matchesTied']),
				noResult: standingNumber(stats, ['noresult']),
				battingBonus: standingNumber(stats, ['battingPoints', 'battingBonus']),
				bowlingBonus: standingNumber(stats, ['bowlingPoints', 'bowlingBonus']),
				points: standingNumber(stats, ['matchPoints']),
				deducted: standingNumber(stats, ['deducted', 'pointDeductions']),
				netRunRate: stats.has('netrr') ? num(stats.get('netrr')) : null
			});
		}
	}
	if (!rows.length) return { ok: false, error: `no standings rows for league ${espnLeagueId}` };
	return { ok: true, value: rows };
}

export function parseCalendarDates(payload: unknown): string[] {
	const root = asRecord(payload);
	const league = asRecord(asArray(root?.leagues)[0]);
	return asArray(league?.calendar)
		.map((item) => str(item).slice(0, 10).replaceAll('-', ''))
		.filter((item) => /^\d{8}$/.test(item));
}

export function isMatchDay(
	calendars: string[][],
	now = new Date(),
	timeZone = 'Europe/London'
): boolean {
	const today = new Intl.DateTimeFormat('en-CA', { timeZone }).format(now).replaceAll('-', '');
	return calendars.some((dates) => dates.includes(today));
}

export { decodeEntities };
