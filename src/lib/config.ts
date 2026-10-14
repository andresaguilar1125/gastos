export const DATA_URL =
	'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFpRO4TrwAcGggAjB_iZVtdKaKhv59Mhzqy7RhE6JYtYmG704aYHMc6Us1etPgoffJZuLtkk4Ec1fE/pub?output=csv';

/**
 * Aportes are single monthly numbers expressed in thousands of colones: an
 * aporte of `110` means ₡110,000 CRC per month. There is no cap and no range —
 * see `docs/logic.md`.
 */
export const APORTE_SCALE = 1000;

/** Monthly income in thousands of colones. 0 = not set yet. */
export const INGRESO_DEFAULT = 1250;

/**
 * Fixed monthly savings amount in thousands of colones (₡540,000). Used by the
 * Home's allocation doughnut (surfaced as an editable "Ahorro mensual" in
 * Configuración).
 */
export const AHORRO_MENSUAL_DEFAULT = 540;

/**
 * How many months of ledger are shown across the app, ending at the reference
 * month. The user picks one of {@link RANGE_MONTH_OPTIONS} in Configuración.
 */
export const DEFAULT_RANGE_MONTHS = 6;

/** Selectable data windows (months). */
export const RANGE_MONTH_OPTIONS = [3, 6, 9, 12] as const;

/**
 * The canonical category list. Every entry is a piggy bank.
 *
 * The defaults are a sensible starting plan (the user can still tune each row
 * in Configuración, or reset it to these values).
 *
 * `Ahorros` is deliberately absent: it is not a piggy bank, so it must not
 * appear in the aportes table, the Home sobres or the grid.
 */
export const DEFAULT_APORTES: Record<string, number> = {
	Recibos: 100,
	Super: 200,
	Comida: 80,
	Extras: 100,
	Viajes: 120
};

/** Stable display order for tables and the grid. */
export const CATEGORIES = ['Recibos', 'Super', 'Comida', 'Extras', 'Viajes'] as const;

/** The category whose spend is excluded from spending totals (it is savings). */
export const SAVINGS_CATEGORY = 'Ahorros';

/** Convert an aporte entered in thousands of colones into real CRC. */
export function toRealAporte(aporte: number): number {
	return aporte * APORTE_SCALE;
}
