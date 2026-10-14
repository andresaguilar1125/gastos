/**
 * Colour resolution for the whole app. There is a **single fixed theme**
 * (`$lib/ui/palettes`): the categorical `SERIES_PALETTE` gives every chart label
 * a stable colour, with the neutral accents (and HEAT_* status colours) reserved
 * for chrome and cues such as Gastado.
 *
 * This module stays `.svelte.ts` so downstream `$derived` values keep working,
 * though the palette no longer changes at runtime.
 */

import {
	ACCENT_5,
	CATEGORY_COLORS,
	COMERCIO_COLORS,
	PERSONA_COLORS,
	SERIES_PALETTE,
	VALUE_COLORS,
	WEEK_COLORS
} from '$lib/ui/palettes';

/** Lowercase and strip accents so casing/accents never change a colour. */
export function normalizeLabel(label: string): string {
	return label
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

/** Stable non-negative hash (djb2) so a label always maps to one colour. */
function hash(label: string): number {
	let h = 5381;
	for (let i = 0; i < label.length; i++) {
		h = (h * 33) ^ label.charCodeAt(i);
	}
	return h >>> 0;
}

/** Case/accent-insensitive lookup in a display-name → colour map. */
function lookup(map: Record<string, string>, key: string): string | null {
	for (const [name, color] of Object.entries(map)) {
		if (normalizeLabel(name) === key) return color;
	}
	return null;
}

/** Colour for a breakdown label; stable across the whole app. */
export function labelColor(label: string): string {
	const key = normalizeLabel(label);
	const persona = lookup(PERSONA_COLORS, key);
	if (persona) return persona;
	const comercio = lookup(COMERCIO_COLORS, key);
	if (comercio) return comercio;
	const week = WEEK_COLORS[label.trim().toUpperCase()];
	if (week) return week;
	return VALUE_COLORS[hash(key) % VALUE_COLORS.length];
}

/** Colour for a canonical category, e.g. on the Home doughnut. */
export function categoryColor(categoria: string): string {
	return lookup(CATEGORY_COLORS, normalizeLabel(categoria)) ?? labelColor(categoria);
}

/**
 * Colours for a list of labels shown **together in one chart**: each label keeps
 * its stable `labelColor`, but if two would clash the later one is pushed to the
 * nearest free palette slot. Guarantees the result has no repeated colours, so a
 * chart never draws two series in the same hue. Order is preserved.
 */
export function seriesColors(labels: string[]): string[] {
	const used = new Set<string>();
	return labels.map((label) => {
		const preferred = labelColor(label);
		let color = preferred;
		if (used.has(color)) {
			const start = hash(normalizeLabel(label)) % SERIES_PALETTE.length;
			for (let i = 0; i < SERIES_PALETTE.length; i++) {
				const candidate = SERIES_PALETTE[(start + i) % SERIES_PALETTE.length];
				if (!used.has(candidate)) {
					color = candidate;
					break;
				}
			}
		}
		used.add(color);
		return color;
	});
}

/** Readable text colour for a hex background: dark on light tones, white on dark. */
export function readableText(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.45 ? ACCENT_5 : '#ffffff';
}
