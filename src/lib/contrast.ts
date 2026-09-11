export const HEX_RE = /^#[0-9a-f]{6}$/i;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const raw = hex.replace('#', '');
	const n = Number.parseInt(raw, 16);
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function linearise(channel: number): number {
	const c = channel / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
	const { r, g, b } = hexToRgb(hex);
	return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/** WCAG 2 contrast ratio between two sRGB hex colours. */
export function contrastRatio(a: string, b: string): number {
	const l1 = relativeLuminance(a);
	const l2 = relativeLuminance(b);
	const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
	return (hi + 0.05) / (lo + 0.05);
}

export const AA_NORMAL_TEXT = 4.5;
