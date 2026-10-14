/**
 * Fixed colour theme. There is **one** theme.
 *
 * Neutrals are navy/slate; the chrome is a single blue. The categorical
 * {@link SERIES_PALETTE} is a green/teal/blue family — deliberately **no red or
 * yellow**. Each chart label keeps a stable colour, and no two labels shown in
 * the same chart ever share one (see `seriesColors`).
 */

/** Neutrals (tailwind tokens `accent-4/5/6`). */
export const ACCENT_4 = '#52647a';
export const ACCENT_5 = '#2d3f54';
export const ACCENT_6 = '#f8f8f8';

/** UI accents (tailwind tokens `accent-1/2/3`). */
export const ACCENT_1 = '#73cc80';
export const ACCENT_2 = '#0fa69d';
export const ACCENT_3 = '#006ecf';

/** App chrome (buttons, active nav, links). */
export const PRIMARY = ACCENT_3;

/** Status cues (also the Home heatmap traffic ramp: success → warning → danger). */
export const SUCCESS = '#73cc80';
export const WARNING = '#0fa69d';
export const DANGER = '#004c94';

/**
 * The categorical palette, in a fixed order: the blues run light→deep, then the
 * teals and the green. Index it with {@link SERIES} rather than hard-coding hexes.
 */
export const SERIES_PALETTE = [
	'#004c94', // 0 deep blue
	'#006ecf', // 1 blue
	'#3c93fa', // 2 sky
	'#00d4c6', // 3 cyan
	'#0fa69d', // 4 teal
	'#028183', // 5 dark teal
	'#73cc80', // 6 green
	'#52647a' // 7 slate
] as const;

/** Shorthand for a palette slot, e.g. `SERIES[3]`. */
export const SERIES = SERIES_PALETTE;

/** Colours available to unknown labels; they hash across the whole palette. */
export const VALUE_COLORS = SERIES_PALETTE;

/**
 * Persona → colour. The nine Super aisles all share one colour (per request);
 * the people are all distinct from one another inside Extras / Comida / Viajes.
 */
export const PERSONA_COLORS: Record<string, string> = {
	// Super aisles (column C on the Super sheet) — one shared colour, no hassle.
	Vegetales: SERIES[2],
	Harinas: SERIES[2],
	Lacteos: SERIES[2],
	Hogar: SERIES[2],
	Granos: SERIES[2],
	Carnes: SERIES[2],
	Salsas: SERIES[2],
	Bebidas: SERIES[2],
	Postres: SERIES[2],
	// People — distinct from one another inside every chart that shows them.
	Andrés: SERIES[0],
	Medico: SERIES[1],
	Mari: SERIES[2],
	Marvin: SERIES[3],
	Casa: SERIES[4],
	Trabajo: SERIES[5],
	Salidas: SERIES[6],
	Express: SERIES[7]
};

/** Known Recibos payees → colour, one per slot (5 distinct). */
export const COMERCIO_COLORS: Record<string, string> = {
	AYA: SERIES[0],
	CNFL: SERIES[1],
	Kolbi: SERIES[2],
	Telecable: SERIES[3],
	IPTV: SERIES[4]
};

/** Canonical category → colour (Home doughnut); 5 distinct slots. */
export const CATEGORY_COLORS: Record<string, string> = {
	Recibos: SERIES[0],
	Super: SERIES[4],
	Comida: SERIES[2],
	Extras: SERIES[5],
	Viajes: SERIES[3]
};

/** Week-of-month → colour (Super chart and Dashboard weekly chart); 4 distinct. */
export const WEEK_COLORS: Record<string, string> = {
	W1: SERIES[0],
	W2: SERIES[1],
	W3: SERIES[2],
	W4: SERIES[3]
};
