import { competitionSchema, type Competition } from './schema.js';

/**
 * Men's county competitions for the configured season.
 * UI must read names and groups from here — never hard-code them.
 * Display names omit title sponsors (no marks).
 */
export const competitions: Competition[] = [
	competitionSchema.parse({
		id: 'championship',
		name: 'County Championship',
		shortName: 'Championship',
		format: 'first-class',
		groups: [
			{
				id: 'division-one',
				name: 'Division One',
				teamIds: [
					'nottinghamshire',
					'surrey',
					'warwickshire',
					'glamorgan',
					'essex',
					'sussex',
					'somerset',
					'yorkshire',
					'hampshire',
					'leicestershire'
				]
			},
			{
				id: 'division-two',
				name: 'Division Two',
				teamIds: [
					'durham',
					'kent',
					'northamptonshire',
					'worcestershire',
					'middlesex',
					'derbyshire',
					'lancashire',
					'gloucestershire'
				]
			}
		]
	}),
	competitionSchema.parse({
		id: 'blast',
		name: 'T20 Blast',
		shortName: 'Blast',
		format: 't20',
		groups: [
			{
				id: 'group-a',
				name: 'Group A',
				teamIds: [
					'derbyshire',
					'durham',
					'lancashire',
					'leicestershire',
					'nottinghamshire',
					'yorkshire'
				]
			},
			{
				id: 'group-b',
				name: 'Group B',
				teamIds: [
					'glamorgan',
					'gloucestershire',
					'northamptonshire',
					'somerset',
					'warwickshire',
					'worcestershire'
				]
			},
			{
				id: 'group-c',
				name: 'Group C',
				teamIds: ['essex', 'kent', 'hampshire', 'middlesex', 'surrey', 'sussex']
			}
		]
	}),
	competitionSchema.parse({
		id: 'one-day-cup',
		name: 'One-Day Cup',
		shortName: 'One-Day Cup',
		format: 'lista',
		groups: [
			{
				id: 'group-a',
				name: 'Group A',
				teamIds: [
					'gloucestershire',
					'kent',
					'lancashire',
					'leicestershire',
					'northamptonshire',
					'nottinghamshire',
					'somerset',
					'surrey',
					'warwickshire'
				]
			},
			{
				id: 'group-b',
				name: 'Group B',
				teamIds: [
					'derbyshire',
					'durham',
					'essex',
					'glamorgan',
					'hampshire',
					'middlesex',
					'sussex',
					'worcestershire',
					'yorkshire'
				]
			}
		]
	})
];

export const competitionById: Record<string, Competition> = Object.fromEntries(
	competitions.map((competition) => [competition.id, competition])
);

export function getCompetition(id: string): Competition | undefined {
	return competitionById[id];
}

export function groupForTeam(
	competitionId: string,
	teamId: string
): { competition: Competition; groupId: string; groupName: string } | undefined {
	const competition = competitionById[competitionId];
	if (!competition) return undefined;
	const group = competition.groups.find((group) => group.teamIds.includes(teamId));
	if (!group) return undefined;
	return { competition, groupId: group.id, groupName: group.name };
}
