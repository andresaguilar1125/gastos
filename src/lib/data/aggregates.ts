import type {
	CategoryAggregate,
	CategoryMom,
	ComercioAggregate,
	MomDelta,
	MonthAggregate,
	NormalizedRow,
	PersonaAggregate
} from '$lib/types';

/**
 * The sheet stores months as text without a year, so months form a single
 * 12-month cycle that we order explicitly (Jan -> Dec).
 */
export const MONTH_ORDER = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
] as const;

const MONTH_ALIASES: Record<string, number> = MONTH_ORDER.reduce(
	(acc, mes, index) => {
		acc[mes.toLowerCase()] = index;
		return acc;
	},
	{} as Record<string, number>
);

export function monthIndex(mes: string | undefined | null): number {
	if (!mes) return -1;
	const key = mes.trim().slice(0, 3).toLowerCase();
	return MONTH_ALIASES[key] ?? -1;
}

/** Short month token for a `YYYY-MM` key, e.g. "2026-06" → "Jun". */
export function monthToken(yearMonth: string): string {
	const mm = Number(yearMonth?.slice(5, 7));
	return MONTH_ORDER[mm - 1] ?? yearMonth ?? '';
}

/** Human label for a `YYYY-MM` key, e.g. "2026-06" → "Jun 2026". */
export function formatYearMonth(yearMonth: string | null | undefined): string {
	if (!yearMonth) return '—';
	const [year, month] = yearMonth.split('-');
	return `${MONTH_ORDER[Number(month) - 1] ?? month} ${year}`;
}

/** Compare two `YYYY-MM` keys chronologically (string order is chronological). */
export function compareYearMonth(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Shift a `YYYY-MM` key by `delta` months (may be negative), e.g.
 * `shiftMonth('2026-10', -5)` → `'2026-05'`. Returns `''` for a blank key.
 */
export function shiftMonth(yearMonth: string, delta: number): string {
	if (!yearMonth) return '';
	const [year, month] = yearMonth.split('-').map(Number);
	if (!Number.isFinite(year) || !Number.isFinite(month)) return '';
	const total = year * 12 + (month - 1) + delta;
	const shiftedYear = Math.floor(total / 12);
	const shiftedMonth = (((total % 12) + 12) % 12) + 1;
	return `${shiftedYear}-${String(shiftedMonth).padStart(2, '0')}`;
}

function sumBy(
	rows: NormalizedRow[],
	key: 'categoria' | 'comercio' | 'persona' | 'personaLabel',
	categoria?: string
): Record<string, number> {
	const map: Record<string, number> = {};
	for (const row of rows) {
		if (categoria && row.categoria.toLowerCase() !== categoria.toLowerCase()) continue;
		const value = String(row[key]).trim();
		if (!value) continue;
		map[value] = (map[value] ?? 0) + row.monto;
	}
	return map;
}

export function sumByCategory(rows: NormalizedRow[]): CategoryAggregate[] {
	const totals = sumBy(rows, 'categoria');
	const grand = Object.values(totals).reduce((a, b) => a + b, 0);
	return Object.entries(totals)
		.map(([categoria, sum]) => ({
			categoria,
			sum,
			pct: grand ? Math.round((sum / grand) * 100) : 0
		}))
		.sort((a, b) => b.sum - a.sum);
}

/** Comercio breakdown, optionally scoped to a category. */
export function sumByComercio(rows: NormalizedRow[], categoria?: string): ComercioAggregate[] {
	const totals = sumBy(rows, 'comercio', categoria);
	return Object.entries(totals)
		.map(([comercio, sum]) => ({ comercio, sum }))
		.sort((a, b) => b.sum - a.sum);
}

/** Persona breakdown (display label), optionally scoped to a category. */
export function sumByPersona(rows: NormalizedRow[], categoria?: string): PersonaAggregate[] {
	const totals = sumBy(rows, 'personaLabel', categoria);
	return Object.entries(totals)
		.map(([label, sum]) => ({ persona: label, label, sum }))
		.sort((a, b) => b.sum - a.sum);
}

export function totalSpend(rows: NormalizedRow[]): number {
	return rows.reduce((sum, r) => sum + r.monto, 0);
}

/** Sum per month, keyed by `YYYY-MM` and sorted chronologically. */
export function sumByMonth(rows: NormalizedRow[]): MonthAggregate[] {
	const totals: Record<string, number> = {};
	for (const row of rows) {
		if (!row.yearMonth) continue;
		totals[row.yearMonth] = (totals[row.yearMonth] ?? 0) + row.monto;
	}

	return Object.entries(totals)
		.map(([yearMonth, sum]) => ({ yearMonth, mes: monthToken(yearMonth), sum }))
		.sort((a, b) => compareYearMonth(a.yearMonth, b.yearMonth));
}

/** Sum per category for a single month. */
export function sumByCategoryForMonth(
	rows: NormalizedRow[],
	yearMonth: string
): Record<string, number> {
	const totals: Record<string, number> = {};
	for (const row of rows) {
		if (row.yearMonth !== yearMonth) continue;
		totals[row.categoria] = (totals[row.categoria] ?? 0) + row.monto;
	}
	return totals;
}

/** Per-month spend map for one category, keyed by `YYYY-MM`. */
export function monthMapForCategory(
	rows: NormalizedRow[],
	categoria: string
): Record<string, number> {
	const map: Record<string, number> = {};
	for (const row of rows) {
		if (row.categoria.toLowerCase() !== categoria.toLowerCase()) continue;
		if (!row.yearMonth) continue;
		map[row.yearMonth] = (map[row.yearMonth] ?? 0) + row.monto;
	}
	return map;
}

/**
 * Month-over-month delta between the current and previous periods.
 * `pct` is the rounded percentage change; a zero previous month yields 100%.
 */
export function momDelta(current: number, previous: number, hasPrevious = true): MomDelta {
	const delta = current - previous;
	let pct = 0;
	if (hasPrevious && previous > 0) {
		pct = Math.round(((current - previous) / previous) * 100);
	} else if (hasPrevious && previous === 0) {
		pct = current > 0 ? 100 : 0;
	}

	const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
	return { delta, pct, direction, hasPrevious };
}

/** Per-category current vs previous month comparison. */
export function categoryMom(
	rows: NormalizedRow[],
	currentYearMonth: string,
	previousYearMonth: string | null
): CategoryMom[] {
	const currentTotals = sumByCategoryForMonth(rows, currentYearMonth);
	const previousTotals = previousYearMonth ? sumByCategoryForMonth(rows, previousYearMonth) : {};

	const categories = new Set([...Object.keys(currentTotals), ...Object.keys(previousTotals)]);

	return Array.from(categories)
		.map((categoria) => {
			const current = currentTotals[categoria] ?? 0;
			const previous = previousTotals[categoria] ?? 0;
			return {
				categoria,
				current,
				previous,
				delta: momDelta(current, previous, previousYearMonth != null)
			};
		})
		.sort((a, b) => b.current - a.current);
}

/** Week-of-month token (`W1`–`W4`) from a row's `periodo` ("YYYYMM-W##"). */
function weekToken(periodo: string): string {
	const match = periodo.match(/W(\d+)$/);
	return match ? `W${Number(match[1])}` : '';
}

/**
 * Spend per week-of-month (W1–W4) for a single month, keyed by category. Powers
 * Home's weekly chart (categories × weeks). Categories without
 * rows simply read no key; callers fall back to 0.
 */
export function weekTotalsForMonth(
	rows: NormalizedRow[],
	yearMonth: string
): Record<string, Record<string, number>> {
	const map: Record<string, Record<string, number>> = {};
	for (const row of rows) {
		if (row.yearMonth !== yearMonth) continue;
		const week = weekToken(row.periodo);
		if (!week) continue;
		const cell = (map[row.categoria] ??= {});
		cell[week] = (cell[week] ?? 0) + row.monto;
	}
	return map;
}
