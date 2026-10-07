import type { NormalizedRow, TripGroupStats, ViajesMonthPoint } from '$lib/types';
import { VIAJES_GROUPS } from '$lib/config';
import { compareYearMonth, monthToken } from '$lib/data/aggregates';

const VIAJES = 'Viajes';

/** Every Viajes row of the (already month-filtered) dataset. */
function viajesRows(rows: NormalizedRow[]): NormalizedRow[] {
	return rows.filter((row) => row.categoria.toLowerCase() === VIAJES.toLowerCase());
}

/**
 * Resolve a raw `persona` value to one of the three chart groups, or `null`
 * when it does not belong to any of them (e.g. `Salidas`/`Citas`, `Casa`).
 */
function groupKeyFor(persona: string): string | null {
	const key = persona.trim().toLowerCase();
	if (!key) return null;
	for (const group of VIAJES_GROUPS) {
		if ((group.raw as readonly string[]).includes(key)) return group.key;
	}
	return null;
}

/** Service detection: a trip is Uber/Didi when its merchant name says so. */
const isUber = (comercio: string) => /uber/i.test(comercio);
const isDidi = (comercio: string) => /didi/i.test(comercio);

/**
 * Per-month per-group spend for the Viajes chart, ascending by month. Only the
 * three chart groups are counted; other personas are ignored on purpose.
 */
export function viajesMonthSeries(
	rows: NormalizedRow[],
	refYearMonth: string | null
): ViajesMonthPoint[] {
	const byMonth: Record<string, Record<string, number>> = {};

	for (const row of viajesRows(rows)) {
		if (!row.yearMonth) continue;
		if (refYearMonth && row.yearMonth > refYearMonth) continue;
		const key = groupKeyFor(row.persona);
		if (!key) continue;
		const cell = (byMonth[row.yearMonth] ??= {});
		cell[key] = (cell[key] ?? 0) + row.monto;
	}

	return Object.entries(byMonth)
		.sort(([a], [b]) => compareYearMonth(a, b))
		.map(([yearMonth, totals]) => ({
			yearMonth,
			mes: monthToken(yearMonth),
			totals,
			total: Object.values(totals).reduce((sum, value) => sum + value, 0)
		}));
}

/**
 * Least-squares linear trend of a numeric series: returns the fitted value per
 * index, so it can be drawn as a line on top of the stacked bars.
 */
export function linearTrend(values: number[]): number[] {
	const n = values.length;
	if (n === 0) return [];
	if (n === 1) return [values[0]];

	const sumX = (n * (n - 1)) / 2;
	const sumY = values.reduce((sum, value) => sum + value, 0);
	const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
	const sumXX = ((n - 1) * n * (2 * n - 1)) / 6;

	const denom = n * sumXX - sumX * sumX;
	const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
	const intercept = (sumY - slope * sumX) / n;

	return values.map((_, index) => intercept + slope * index);
}

/**
 * Trip statistics per chart group: how many trips, their average fare, and the
 * same split by service (Uber / Didi). One CSV row = one trip.
 */
export function tripStats(rows: NormalizedRow[]): TripGroupStats[] {
	type Acc = { count: number; sum: number; uberCount: number; uberSum: number; didiCount: number; didiSum: number };

	const empty = (): Acc => ({ count: 0, sum: 0, uberCount: 0, uberSum: 0, didiCount: 0, didiSum: 0 });
	const acc: Record<string, Acc> = {};
	for (const group of VIAJES_GROUPS) acc[group.key] = empty();

	for (const row of viajesRows(rows)) {
		const key = groupKeyFor(row.persona);
		if (!key || !acc[key]) continue;
		const a = acc[key];
		a.count += 1;
		a.sum += row.monto;
		if (isUber(row.comercio)) {
			a.uberCount += 1;
			a.uberSum += row.monto;
		}
		if (isDidi(row.comercio)) {
			a.didiCount += 1;
			a.didiSum += row.monto;
		}
	}

	const mean = (sum: number, count: number) => (count > 0 ? Math.round(sum / count) : 0);

	return VIAJES_GROUPS.map((group) => {
		const a = acc[group.key];
		return {
			key: group.key,
			label: group.label,
			color: group.color,
			count: a.count,
			average: mean(a.sum, a.count),
			uberCount: a.uberCount,
			uberAverage: mean(a.uberSum, a.uberCount),
			didiCount: a.didiCount,
			didiAverage: mean(a.didiSum, a.didiCount)
		};
	});
}

/** Months needed to reach `target` at `savingPerMonth` (null when saving is 0). */
export function carGoalMonths(target: number, savingPerMonth: number): number | null {
	if (savingPerMonth <= 0) return null;
	return Math.ceil(target / savingPerMonth);
}
