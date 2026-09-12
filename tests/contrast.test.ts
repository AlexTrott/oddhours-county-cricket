import { describe, expect, it } from 'vitest';
import { AA_NORMAL_TEXT, contrastRatio } from '../src/lib/contrast.js';
import { counties } from '../src/lib/config/counties.js';

const PETROL_INK = '#122326';
const PETROL_PAPER = '#f0f4f3';
const DARK_PAPER = '#0e1a1b';
const DARK_FG = '#e7f1f0';

describe('WCAG AA palettes', () => {
	it('keeps petrol body text AA', () => {
		expect(contrastRatio('#122326', PETROL_PAPER)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
		expect(contrastRatio('#1c7e84', '#f7faf9')).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
		expect(contrastRatio('#d4a017', PETROL_INK)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
		expect(contrastRatio(DARK_FG, DARK_PAPER)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
	});

	it('gives every county light and dark AA band/accent pairs', () => {
		for (const county of counties) {
			const { light, dark } = county.palette;
			expect(
				contrastRatio(light.band, light.bandFg),
				`${county.id} light band`
			).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
			expect(
				contrastRatio(light.accent, PETROL_INK),
				`${county.id} light accent`
			).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
			expect(
				contrastRatio(dark.band, dark.bandFg),
				`${county.id} dark band`
			).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
			expect(
				contrastRatio(dark.accent, PETROL_INK),
				`${county.id} dark CTA on ink`
			).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
		}
	});
});
