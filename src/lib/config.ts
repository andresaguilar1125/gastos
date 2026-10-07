export const DATA_URL =
	'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFpRO4TrwAcGggAjB_iZVtdKaKhv59Mhzqy7RhE6JYtYmG704aYHMc6Us1etPgoffJZuLtkk4Ec1fE/pub?output=csv';

/**
 * Aportes are single monthly numbers expressed in thousands of colones: an
 * aporte of `110` means ₡110,000 CRC per month. There is no cap and no range —
 * see `docs/logic.md`.
 */
export const APORTE_SCALE = 1000;

/** Monthly income in thousands of colones. 0 = not set yet. */
export const INGRESO_DEFAULT = 0;

/**
 * The canonical category list. Every entry is a piggy bank.
 *
 * All defaults are **0 on purpose**: the user sets aportes "on demand" in
 * Configuración (or via the "Sugerir" button).
 *
 * `Ahorros` is deliberately absent: savings are no longer one aporte but a list
 * of named savings lines owned by the `/ahorro` tab (see `SavingsLine`), so it
 * must not appear in the aportes table, the Dashboard alcancías or the grid.
 */
export const DEFAULT_APORTES: Record<string, number> = {
	Recibos: 0,
	Super: 0,
	Comida: 0,
	Extras: 0,
	Viajes: 0
};

/** Stable display order for tables and the grid. */
export const CATEGORIES = ['Recibos', 'Super', 'Comida', 'Extras', 'Viajes'] as const;

/** The category whose spend is excluded from spending totals (it is savings). */
export const SAVINGS_CATEGORY = 'Ahorros';

/** Savings lines default to empty: the user builds the plan on `/ahorro`. */
export const DEFAULT_SAVINGS_LINES: import('$lib/types').SavingsLine[] = [];

export const CATEGORY_COLORS: Record<string, string> = {
	Ahorros: '#166534',
	Comida: '#15803d',
	Extras: '#0f766e',
	Recibos: '#0e7490',
	Super: '#1d4ed8',
	Viajes: '#1e3a8a'
};

/**
 * The Viajes page groups every trip by **persona**. Three groups keep the chart
 * readable; the `#` variants (`Salidas`, `Citas`) are intentionally excluded
 * from the chart and only surface in the full breakdown.
 *
 * `raw` lists the raw `persona` values (lower-cased) that belong to the group.
 */
export const VIAJES_GROUPS = [
	{ key: 'andres', label: 'Andrés', raw: ['andres'], color: '#1e3a8a' },
	{ key: 'mari', label: 'Mari', raw: ['mari'], color: '#15803d' },
	{ key: 'trabajo', label: 'Trabajo', raw: ['trabajo'], color: '#0f766e' }
] as const;

/** Monthly Viajes limit shown as a reference line, in thousands of colones. */
export const VIAJES_LIMIT_DEFAULT = 80;

/** Default electric-car goal: target in thousands of colones + monthly saving. */
export const CAR_GOAL_DEFAULT = { targetMil: 8000, savingMil: 100 };

/** Convert an aporte entered in thousands of colones into real CRC. */
export function toRealAporte(aporte: number): number {
	return aporte * APORTE_SCALE;
}

