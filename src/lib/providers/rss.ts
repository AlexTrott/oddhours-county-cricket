import { appConfig } from '../config/index.js';
import { countyIdFromEspnTeam } from './espn-teams.js';

export type RssItem = {
	externalId: string;
	title: string;
	link: string;
	homeTeamId: string | null;
	awayTeamId: string | null;
};

function decode(value: string): string {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&nbsp;/g, ' ')
		.trim();
}

function teamFromToken(token: string): string | null {
	const cleaned = token
		.replace(/\d.*$/, '')
		.replace(/\*.*$/, '')
		.replace(/\s+v\s*$/i, '')
		.trim();
	return countyIdFromEspnTeam({ name: cleaned, displayName: cleaned, abbreviation: '' });
}

export function parseLiveScoresRss(xml: string): RssItem[] {
	const items: RssItem[] = [];
	const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
	for (const block of blocks) {
		const title = decode((block.match(/<title>([\s\S]*?)<\/title>/i) ?? [])[1] ?? '');
		const link = decode((block.match(/<link>([\s\S]*?)<\/link>/i) ?? [])[1] ?? '');
		const guid = decode((block.match(/<guid>([\s\S]*?)<\/guid>/i) ?? [])[1] ?? '');
		if (/women/i.test(title)) continue;
		const idMatch = (guid || link).match(/match\/(\d+)/);
		const vs = title.split(/\s+v\s+/i);
		if (vs.length < 2) continue;
		const homeTeamId = teamFromToken(vs[0]);
		const awayTeamId = teamFromToken(vs[1]);
		if (!homeTeamId || !awayTeamId) continue;
		items.push({
			externalId: idMatch?.[1] ?? title,
			title,
			link,
			homeTeamId,
			awayTeamId
		});
	}
	void appConfig;
	return items;
}
