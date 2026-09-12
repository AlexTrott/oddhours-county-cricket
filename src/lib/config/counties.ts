import { countySchema, type County } from './schema.js';

const PAPER_WHITE = '#f7faf9';
const DARK_FG = '#e7f1f0';
const GOLD = '#d4a017';
const GOLD_HOT = '#e8a33d';

function county(
	partial: Omit<County, 'palette'> & {
		band: string;
		darkBand: string;
		accent?: string;
		accentHot?: string;
	}
): County {
	const accent = partial.accent ?? GOLD;
	const accentHot = partial.accentHot ?? GOLD_HOT;
	return countySchema.parse({
		id: partial.id,
		name: partial.name,
		shortName: partial.shortName,
		abbreviation: partial.abbreviation,
		blastName: partial.blastName,
		homeGround: partial.homeGround,
		youtubeChannelId: partial.youtubeChannelId,
		palette: {
			light: {
				band: partial.band,
				bandFg: PAPER_WHITE,
				accent,
				accentHot
			},
			dark: {
				band: partial.darkBand,
				bandFg: DARK_FG,
				accent,
				accentHot
			}
		}
	});
}

/**
 * Eighteen first-class counties. Colours are traditional kit / identity
 * approximations for a CSS overlay — not official crests or sponsor marks.
 * YouTube channel IDs are official public channel IDs (not live-stream discovery).
 */
export const counties: County[] = [
	county({
		id: 'derbyshire',
		name: 'Derbyshire',
		shortName: 'Derbyshire',
		abbreviation: 'DER',
		blastName: 'Derbyshire Falcons',
		homeGround: 'Derby',
		youtubeChannelId: 'UC8PDmb5RA6IFLEEhmR7Tfvg',
		band: '#1e4b8a',
		darkBand: '#40669c',
		accent: '#d4a017'
	}),
	county({
		id: 'durham',
		name: 'Durham',
		shortName: 'Durham',
		abbreviation: 'DUR',
		blastName: 'Durham',
		homeGround: 'Chester-le-Street',
		youtubeChannelId: 'UC4WM9EuUoBl3IsOdiJ-hgFA',
		band: '#16315c',
		darkBand: '#395074',
		accent: '#c9a227'
	}),
	county({
		id: 'essex',
		name: 'Essex',
		shortName: 'Essex',
		abbreviation: 'ESS',
		blastName: 'Essex',
		homeGround: 'Chelmsford',
		youtubeChannelId: 'UCL0ebrj8ISVXWikxxtjRlsA',
		band: '#12284a',
		darkBand: '#3d5475',
		accent: '#d4891a'
	}),
	county({
		id: 'glamorgan',
		name: 'Glamorgan',
		shortName: 'Glamorgan',
		abbreviation: 'GLA',
		blastName: 'Glamorgan',
		homeGround: 'Sophia Gardens',
		youtubeChannelId: 'UCZ64uV20GKk9MIi2Y6YmOcA',
		band: '#0b4f8a',
		darkBand: '#30699c',
		accent: '#d4a017'
	}),
	county({
		id: 'gloucestershire',
		name: 'Gloucestershire',
		shortName: 'Gloucestershire',
		abbreviation: 'GLO',
		blastName: 'Gloucestershire',
		homeGround: 'Bristol',
		youtubeChannelId: 'UC2bxVF6gzuzsCceyZRQS_sg',
		band: '#1b4f8c',
		darkBand: '#3d699d',
		accent: '#e0b040'
	}),
	county({
		id: 'hampshire',
		name: 'Hampshire',
		shortName: 'Hampshire',
		abbreviation: 'HAM',
		blastName: 'Hampshire Hawks',
		homeGround: 'Southampton',
		youtubeChannelId: 'UC8lemPb9z8zjmlk6tlkm6_Q',
		band: '#0d2f6b',
		darkBand: '#314e81',
		accent: '#d4a017'
	}),
	county({
		id: 'kent',
		name: 'Kent',
		shortName: 'Kent',
		abbreviation: 'KEN',
		blastName: 'Kent Spitfires',
		homeGround: 'Canterbury',
		youtubeChannelId: 'UCTtkVP_v56wU8zXpVBpdaZQ',
		band: '#1a2744',
		darkBand: '#3c4760',
		accent: '#d4784a'
	}),
	county({
		id: 'lancashire',
		name: 'Lancashire',
		shortName: 'Lancashire',
		abbreviation: 'LAN',
		blastName: 'Lancashire Lightning',
		homeGround: 'Old Trafford',
		youtubeChannelId: 'UCMuJTF1RnDPCrNl_QqIQjhg',
		band: '#6c1d45',
		darkBand: '#823f61',
		accent: '#d4a017'
	}),
	county({
		id: 'leicestershire',
		name: 'Leicestershire',
		shortName: 'Leicestershire',
		abbreviation: 'LEI',
		blastName: 'Leicestershire Foxes',
		homeGround: 'Grace Road',
		youtubeChannelId: 'UC7xUPm_jM9uZ4jJKho6XAhg',
		band: '#1a5c32',
		darkBand: '#3a7550',
		accent: '#d4a017'
	}),
	county({
		id: 'middlesex',
		name: 'Middlesex',
		shortName: 'Middlesex',
		abbreviation: 'MID',
		blastName: 'Middlesex',
		homeGround: "Lord's",
		youtubeChannelId: 'UCj8uKvxoOpYEXE4SzZRtlgw',
		band: '#1d3f8f',
		darkBand: '#3f5ca0',
		accent: '#3aa0d8',
		accentHot: '#2490c8'
	}),
	county({
		id: 'northamptonshire',
		name: 'Northamptonshire',
		shortName: 'Northants',
		abbreviation: 'NOR',
		blastName: 'Northamptonshire Steelbacks',
		homeGround: 'Wantage Road',
		youtubeChannelId: 'UCT1aGQpOXmqSHH63xvxn1TA',
		band: '#6b1c32',
		darkBand: '#813e51',
		accent: '#d4891a'
	}),
	county({
		id: 'nottinghamshire',
		name: 'Nottinghamshire',
		shortName: 'Notts',
		abbreviation: 'NOT',
		blastName: 'Notts Outlaws',
		homeGround: 'Trent Bridge',
		youtubeChannelId: 'UCiOki3bA8llEHVgXBQ3x6wg',
		band: '#14532d',
		darkBand: '#376d4d',
		accent: '#d4a017'
	}),
	county({
		id: 'somerset',
		name: 'Somerset',
		shortName: 'Somerset',
		abbreviation: 'SOM',
		blastName: 'Somerset',
		homeGround: 'Taunton',
		youtubeChannelId: 'UCcCeaTFtzWdkTQYeFRRWvSg',
		band: '#4a1530',
		darkBand: '#65384f',
		accent: '#d4a017'
	}),
	county({
		id: 'surrey',
		name: 'Surrey',
		shortName: 'Surrey',
		abbreviation: 'SUR',
		blastName: 'Surrey',
		homeGround: 'The Oval',
		youtubeChannelId: 'UCZLlXPWxwCtQxrspxx8pU-Q',
		band: '#4a2c17',
		darkBand: '#654c3a',
		accent: '#d4a017'
	}),
	county({
		id: 'sussex',
		name: 'Sussex',
		shortName: 'Sussex',
		abbreviation: 'SUS',
		blastName: 'Sussex Sharks',
		homeGround: 'Hove',
		youtubeChannelId: 'UC50wZUsUCBzXWsFn0vmaOAA',
		band: '#16315c',
		darkBand: '#395074',
		accent: '#d4a017'
	}),
	county({
		id: 'warwickshire',
		name: 'Warwickshire',
		shortName: 'Warwickshire',
		abbreviation: 'WAR',
		blastName: 'Birmingham Bears',
		homeGround: 'Edgbaston',
		youtubeChannelId: 'UCjuPCm2kCY9gIRij1hGW5mw',
		band: '#1e3a6e',
		darkBand: '#3c5475',
		accent: '#d4a017'
	}),
	county({
		id: 'worcestershire',
		name: 'Worcestershire',
		shortName: 'Worcestershire',
		abbreviation: 'WOR',
		blastName: 'Worcestershire Rapids',
		homeGround: 'New Road',
		youtubeChannelId: 'UCorQ8Y6syhWYB6QJW_4xVzQ',
		band: '#1f4d2b',
		darkBand: '#41684b',
		accent: '#d4a017'
	}),
	county({
		id: 'yorkshire',
		name: 'Yorkshire',
		shortName: 'Yorkshire',
		abbreviation: 'YOR',
		blastName: 'Yorkshire',
		homeGround: 'Headingley',
		youtubeChannelId: 'UCfbQbd1wpa6SP0uo22T6cXA',
		band: '#0f3d6e',
		darkBand: '#335a84',
		accent: '#d4a017'
	})
];

export const countyById: Record<string, County> = Object.fromEntries(
	counties.map((county) => [county.id, county])
);

export function getCounty(id: string): County | undefined {
	return countyById[id];
}

export const COUNTY_IDS = counties.map((county) => county.id);
