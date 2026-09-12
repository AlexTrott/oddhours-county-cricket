import { counties } from './counties.js';
import { competitions } from './competitions.js';
import { countyById } from './counties.js';

export function assertConfigGraph(): void {
	const ids = new Set(counties.map((county) => county.id));
	if (ids.size !== 18) {
		throw new Error(`Expected 18 counties, found ${ids.size}`);
	}
	for (const competition of competitions) {
		const seen = new Set<string>();
		for (const group of competition.groups) {
			for (const teamId of group.teamIds) {
				if (!countyById[teamId]) {
					throw new Error(`${competition.id}/${group.id} references unknown county ${teamId}`);
				}
				if (seen.has(teamId)) {
					throw new Error(`${teamId} appears twice in ${competition.id}`);
				}
				seen.add(teamId);
			}
		}
		if (seen.size !== 18) {
			throw new Error(`${competition.id} covers ${seen.size} counties, expected 18`);
		}
	}
}

assertConfigGraph();
