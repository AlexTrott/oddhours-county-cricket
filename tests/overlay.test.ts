import { describe, expect, it } from 'vitest';
import { countyOverlayCss, isCountyId, themeColorFor } from '../src/lib/config/overlay.js';

describe('favourite overlay', () => {
	it('is a token overlay, not a ninth house theme class', () => {
		const css = countyOverlayCss();
		expect(css).toContain('html.theme-petrol[data-county="nottinghamshire"]');
		expect(css).toContain('--oh-band:');
		expect(css).not.toMatch(/theme-notts|theme-yorkshire|theme-county/);
	});

	it('rejects unknown favourite ids', () => {
		expect(isCountyId('nottinghamshire')).toBe(true);
		expect(isCountyId('mcc')).toBe(false);
	});

	it('uses the county band for theme-color', () => {
		expect(themeColorFor('nottinghamshire', 'light')).toBe('#14532d');
	});
});
