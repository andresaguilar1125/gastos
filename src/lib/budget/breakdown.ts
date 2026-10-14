import type {
	BreakdownGroup,
	BreakdownMonthPoint,
	NormalizedRow,
	TripGroupStats
} from '$lib/types';
import { labelColor, seriesColors } from '$lib/ui/colors.svelte';
import { compareYearMonth, monthToken } from '$lib/data/aggregates';

/** Which column a category's breakdown groups by. */
export type BreakdownDimension = 'comercio' | 'persona' | 'semana';

/** Fallback label for rows whose breakdown value is empty, per dimension. */
const NO_VALUE: Record<BreakdownDimension, string> = {
	comercio: 'Sin comercio',
	persona: 'Sin persona',
	semana: 'Sin semana'
};

/** Every row of the (already month-filtered) dataset in one category. */
function categoryRows(rows: NormalizedRow[], categoria: string): NormalizedRow[] {
	return rows.filter((row) => row.categoria.toLowerCase() === categoria.toLowerCase());
}

/**
 * Week-of-month token (`W1`–`W4`) from a row's `periodo` ("YYYYMM-W##"). The
 * bucket itself is computed in `parsePeriodo` (01–07 / 08–14 / 15–21 / 22–31).
 */
function weekLabel(periodo: string): string {
	const match = periodo.match(/W(\d+)$/);
	return match ? `W${Number(match[1])}` : '';
}

/** Raw breakdown value of a row for the chosen dimension. */
function valueOf(row: NormalizedRow, dimension: BreakdownDimension): string {
	if (dimension === 'comercio') return row.comercio;
	if (dimension === 'semana') return weekLabel(row.periodo);
	return row.personaLabel;
}

/** Display label of a row's breakdown value; empty values fall back per dimension. */
function labelOf(row: NormalizedRow, dimension: BreakdownDimension): string {
	return valueOf(row, dimension).trim() || NO_VALUE[dimension];
}

export interface BreakdownMonthSeries {
	points: BreakdownMonthPoint[];
	/** Chart series in legend order: every label, biggest total first. */
	groups: BreakdownGroup[];
}

/**
 * Per-month spend for a category's breakdown chart, ascending by month. Every
 * label is a series of its own (no `Otros` folding). Labels are ranked by total
 * spend over the visible (reference-filtered) history so legend order stays
 * stable across every month; each label keeps a fixed colour and no two series
 * in the chart share one (`seriesColors`).
 */
export function breakdownMonthSeries(
	rows: NormalizedRow[],
	categoria: string,
	dimension: BreakdownDimension,
	refYearMonth: string | null
): BreakdownMonthSeries {
	const visible = categoryRows(rows, categoria).filter(
		(row) => row.yearMonth && (!refYearMonth || row.yearMonth <= refYearMonth)
	);

	const totals: Record<string, number> = {};
	for (const row of visible) {
		const label = labelOf(row, dimension);
		totals[label] = (totals[label] ?? 0) + row.monto;
	}
	const ordered = Object.entries(totals)
		// Weeks stay in natural order (W1–W4); every other dimension ranks by spend.
		.sort((a, b) => (dimension === 'semana' ? a[0].localeCompare(b[0]) : b[1] - a[1]))
		.map(([label]) => label);

	const byMonth: Record<string, Record<string, number>> = {};
	for (const row of visible) {
		const label = labelOf(row, dimension);
		const cell = (byMonth[row.yearMonth] ??= {});
		cell[label] = (cell[label] ?? 0) + row.monto;
	}

	const points = Object.entries(byMonth)
		.sort(([a], [b]) => compareYearMonth(a, b))
		.map(([yearMonth, monthTotals]) => ({
			yearMonth,
			mes: monthToken(yearMonth),
			totals: monthTotals,
			total: Object.values(monthTotals).reduce((sum, value) => sum + value, 0)
		}));

	const groups: BreakdownGroup[] = (() => {
		const colors = seriesColors(ordered);
		return ordered.map((label, i) => ({ label, color: colors[i] }));
	})();

	return { points, groups };
}

/** Per-label totals: purchases, spend and mean ticket, biggest first. */
export function breakdownStats(
	rows: NormalizedRow[],
	categoria: string,
	dimension: BreakdownDimension
): TripGroupStats[] {
	const acc: Record<string, { count: number; sum: number }> = {};
	for (const row of categoryRows(rows, categoria)) {
		const label = labelOf(row, dimension);
		const a = (acc[label] ??= { count: 0, sum: 0 });
		a.count += 1;
		a.sum += row.monto;
	}

	const ordered = Object.entries(acc).sort((a, b) => b[1].sum - a[1].sum);

	return ordered.map(([label, a]) => ({
		key: label,
		label,
		color: labelColor(label),
		count: a.count,
		sum: a.sum,
		average: a.count > 0 ? Math.round(a.sum / a.count) : 0
	}));
}
