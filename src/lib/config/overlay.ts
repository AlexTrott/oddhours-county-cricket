import { counties } from './counties.js';
import { appConfig } from './app.js';
import type { County } from './schema.js';

export const FAVOURITE_COOKIE = 'ccl_favourite';
export const SCHEME_COOKIE = 'ccl_scheme';
export const FAVOURITE_STORAGE_KEY = 'ccl-favourite';
export const SCHEME_STORAGE_KEY = 'ccl-scheme';

export type ColourScheme = 'light' | 'dark';

export function isCountyId(value: string | null | undefined): value is string {
	return Boolean(value && counties.some((county) => county.id === value));
}

export function parseScheme(value: string | null | undefined): ColourScheme {
	return value === 'dark' ? 'dark' : 'light';
}

export function paletteFor(county: County, scheme: ColourScheme) {
	return county.palette[scheme];
}

/** County overlay on OddHours tokens. Not a ninth house theme. */
export function countyOverlayCss(): string {
	const lines: string[] = [
		`html.theme-petrol { color-scheme: light; }`,
		`html.theme-petrol[data-scheme="dark"] {`,
		`  color-scheme: dark;`,
		`  --oh-paper: #0e1a1b;`,
		`  --oh-paper-deep: #0a1415;`,
		`  --oh-paper-white: #163033;`,
		`  --oh-ink: #e7f1f0;`,
		`  --oh-muted: #9bb3b0;`,
		`  --oh-bg: #0e1a1b;`,
		`  --oh-bg-2: #0a1415;`,
		`  --oh-surface: #163033;`,
		`  --oh-fg: #e7f1f0;`,
		`  --oh-fg-muted: #9bb3b0;`,
		`  --oh-on-dark: #e7f1f0;`,
		`  --oh-shadow-colour: #041010;`,
		`  --oh-border: var(--oh-border-width) solid #e7f1f0;`,
		`  --oh-band: #1c7e84;`,
		`  --oh-band-fg: #e7f1f0;`,
		`  --oh-accent: #d4a017;`,
		`  --oh-accent-hot: #e8a33d;`,
		`  --oh-cta: var(--oh-accent);`,
		`  --oh-cta-hover: var(--oh-accent-hot);`,
		`}`,
		`html.theme-petrol[data-scheme="dark"] .oh-btn--primary { --oh-btn-fg: #122326; }`
	];

	for (const county of counties) {
		const light = county.palette.light;
		const dark = county.palette.dark;
		lines.push(
			`html.theme-petrol[data-county="${county.id}"] {`,
			`  --oh-band: ${light.band};`,
			`  --oh-band-fg: ${light.bandFg};`,
			`  --oh-accent: ${light.accent};`,
			`  --oh-accent-hot: ${light.accentHot};`,
			`  --oh-cta: var(--oh-accent);`,
			`  --oh-cta-hover: var(--oh-accent-hot);`,
			`}`,
			`html.theme-petrol[data-scheme="dark"][data-county="${county.id}"] {`,
			`  --oh-band: ${dark.band};`,
			`  --oh-band-fg: ${dark.bandFg};`,
			`  --oh-accent: ${dark.accent};`,
			`  --oh-accent-hot: ${dark.accentHot};`,
			`  --oh-cta: var(--oh-accent);`,
			`  --oh-cta-hover: var(--oh-accent-hot);`,
			`}`
		);
	}

	return lines.join('\n');
}

export function themeColorFor(countyId: string | null, scheme: ColourScheme): string {
	if (countyId) {
		const county = counties.find((item) => item.id === countyId);
		if (county) return county.palette[scheme].band;
	}
	return scheme === 'dark' ? '#1c7e84' : appConfig.themeColor;
}
