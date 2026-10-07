import type { CategoryMonthPoint, MonthGridRow, NormalizedRow, PiggyBank } from '$lib/types';
import { APORTE_SCALE, SAVINGS_CATEGORY } from '$lib/config';
import { formatYearMonth, monthMapForCategory, monthToken } from '$lib/data/aggregates';

export { formatYearMonth };

/**
 * Number of months from a category's epoch up to and including `refYearMonth`.
 * Months with no rows still count, because the `aporte` is paid every month.
 *
 * The epoch is the category's first month with data. `Ahorros` has no rows at
 * all, so it is anchored to the **global epoch** (the first month with any
 * data) — otherwise it would compute zero months.
 */
export function elapsedMonths(
	rows: NormalizedRow[],
	categoria: string,
	refYearMonth: string | null
): number {
	if (!refYearMonth) return 0;

	let epoch: string | undefined;

	if (categoria === SAVINGS_CATEGORY) {
		epoch = rows.reduce<string | undefined>(
			(min, row) => (row.yearMonth && (!min || row.yearMonth < min) ? row.yearMonth : min),
			undefined
		);
	} else {
		epoch = rows.reduce<string | undefined>(
			(min, row) =>
				row.categoria.toLowerCase() === categoria.toLowerCase() &&
				row.yearMonth &&
				(!min || row.yearMonth < min)
					? row.yearMonth
					: min,
			undefined
		);
	}

	if (!epoch || epoch > refYearMonth) return 0;

	const [epochYear, epochMonth] = epoch.split('-').map(Number);
	const [refYear, refMonth] = refYearMonth.split('-').map(Number);
	return (refYear - epochYear) * 12 + (refMonth - epochMonth) + 1;
}

/** The earliest `YYYY-MM` present in the dataset (the global epoch). */
export function globalEpoch(rows: NormalizedRow[]): string | null {
	return (
		rows.reduce<string | undefined>(
			(min, row) => (row.yearMonth && (!min || row.yearMonth < min) ? row.yearMonth : min),
			undefined
		) ?? null
	);
}

/**
 * Build every piggy bank from the plan and the ledger.
 *
 *   aportado = elapsedMonths × aporte
 *   saldo    = aportado − Σ gasto (up to and including the reference month)
 *   budgetPct = this month's spend / aporte   (null when aporte is 0)
 */
export function piggyBanks(
	rows: NormalizedRow[],
	aportes: Record<string, number>,
	refYearMonth: string | null
): PiggyBank[] {
	return Object.entries(aportes).map(([categoria, aporteMil]) => {
		const aporte = aporteMil * APORTE_SCALE;
		const byMonth = monthMapForCategory(rows, categoria);
		const months = elapsedMonths(rows, categoria, refYearMonth);

		const gastado = Object.entries(byMonth)
			.filter(([yearMonth]) => !refYearMonth || yearMonth <= refYearMonth)
			.reduce((sum, [, value]) => sum + value, 0);

		const aportado = months * aporte;
		const saldo = aportado - gastado;
		const esteMes = refYearMonth ? (byMonth[refYearMonth] ?? 0) : 0;

		return {
			categoria,
			aporte,
			aportado,
			gastado,
			saldo,
			budgetPct: aporte > 0 ? esteMes / aporte : null,
			elapsedMonths: months,
			esteMes,
			byMonth
		};
	});
}

/**
 * Categories × months grid. Each cell shows that month's `gasto`; `over` is
 * true when `gasto > aporte` **and** the aporte is configured (> 0).
 */
export function monthlyGrid(
	rows: NormalizedRow[],
	aportes: Record<string, number>,
	months: string[]
): MonthGridRow[] {
	return Object.entries(aportes).map(([categoria, aporteMil]) => {
		const aporte = aporteMil * APORTE_SCALE;
		const byMonth = monthMapForCategory(rows, categoria);
		const cells = months.map((yearMonth) => {
			const gasto = byMonth[yearMonth] ?? 0;
			return { yearMonth, gasto, over: aporte > 0 && gasto > aporte };
		});
		return {
			categoria,
			aporte,
			cells,
			total: cells.reduce((sum, cell) => sum + cell.gasto, 0)
		};
	});
}

/**
 * One category's spend per month, ascending, limited to the last `limit`
 * months that have data. `over` is true when the month's spend exceeds the
 * aporte (and the aporte is configured). Powers the month-over-month list.
 */
export function categoryMonthSeries(
	rows: NormalizedRow[],
	categoria: string,
	aporte: number,
	limit = 12
): CategoryMonthPoint[] {
	const byMonth = monthMapForCategory(rows, categoria);
	return Object.entries(byMonth)
		.sort(([a], [b]) => (a < b ? -1 : 1))
		.slice(-limit)
		.map(([yearMonth, gasto]) => ({
			yearMonth,
			mes: monthToken(yearMonth),
			gasto,
			over: aporte > 0 && gasto > aporte
		}));
}

/**
 * Average monthly spend over the last `months` months that have data (default
 * 6), in thousands of colones. This powers the "Sugerir" hint; a manual value
 * always wins.
 */
export function averagePerMonth(
	rows: NormalizedRow[],
	categoria: string,
	months = 6
): number {
	const byMonth = monthMapForCategory(rows, categoria);
	const values = Object.entries(byMonth)
		.sort(([a], [b]) => (a < b ? 1 : -1))
		.slice(0, months)
		.map(([, value]) => value);

	if (values.length === 0) return 0;
	return Math.round(values.reduce((a, b) => a + b, 0) / values.length / APORTE_SCALE);
}
