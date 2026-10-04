import { AHORRO_DUPLICATE_FACTOR } from '$lib/config';
import type {
	CategoryAggregate,
	CategoryMom,
	GrupoAggregate,
	MomDelta,
	MonthAggregate,
	NormalizedRow,
	NotaAggregate,
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

export function injectAhorroDuplicates(rows: NormalizedRow[]): NormalizedRow[] {
	const result: NormalizedRow[] = [];
	for (const row of rows) {
		if (row.categoria.toLowerCase() === 'ahorro') {
			for (let i = 0; i < AHORRO_DUPLICATE_FACTOR; i++) {
				result.push({ ...row });
			}
		} else {
			result.push(row);
		}
	}
	return result;
}

function sumBy(rows: NormalizedRow[], key: keyof NormalizedRow): Record<string, number> {
	const map: Record<string, number> = {};
	for (const row of rows) {
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
		.map(([categoria, sum]) => ({ categoria, sum, pct: grand ? Math.round((sum / grand) * 100) : 0 }))
		.sort((a, b) => b.sum - a.sum);
}

export function sumByNota(rows: NormalizedRow[]): NotaAggregate[] {
	const recibos = rows.filter((r) => r.categoria.toLowerCase() === 'recibos');
	const totals = sumBy(recibos, 'nota');
	return Object.entries(totals)
		.map(([nota, sum]) => ({ nota, sobre: 'Recibos', sum }))
		.sort((a, b) => b.sum - a.sum);
}

export function sumByGrupo(rows: NormalizedRow[]): GrupoAggregate[] {
	const superRows = rows.filter((r) => r.categoria.toLowerCase() === 'super');
	const totals = sumBy(superRows, 'grupo');
	return Object.entries(totals)
		.map(([grupo, sum]) => ({ grupo, sum }))
		.sort((a, b) => b.sum - a.sum);
}

export function sumByPersona(rows: NormalizedRow[]): PersonaAggregate[] {
	const viajes = rows.filter((r) => r.categoria.toLowerCase() === 'viajes');
	const totals = sumBy(viajes, 'persona');
	return Object.entries(totals)
		.map(([persona, sum]) => ({ persona, sum }))
		.sort((a, b) => b.sum - a.sum);
}

export function totalSpend(rows: NormalizedRow[]): number {
	return rows.reduce((sum, r) => sum + r.monto, 0);
}

/** Sum per month, sorted chronologically (Jan -> Dec). */
export function sumByMonth(rows: NormalizedRow[]): MonthAggregate[] {
	const totals: Record<string, number> = {};
	for (const row of rows) {
		const index = monthIndex(row.mes);
		if (index < 0) continue;
		totals[MONTH_ORDER[index]] = (totals[MONTH_ORDER[index]] ?? 0) + row.monto;
	}

	return Object.entries(totals)
		.map(([mes, sum]) => ({ mes, sum, index: monthIndex(mes) }))
		.sort((a, b) => a.index - b.index);
}

/** Sum per category for a single month. */
export function sumByCategoryForMonth(rows: NormalizedRow[], mes: string): Record<string, number> {
	const target = monthIndex(mes);
	const totals: Record<string, number> = {};
	for (const row of rows) {
		if (monthIndex(row.mes) !== target) continue;
		totals[row.categoria] = (totals[row.categoria] ?? 0) + row.monto;
	}
	return totals;
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
export function categoryMom(rows: NormalizedRow[], currentMes: string, previousMes: string | null): CategoryMom[] {
	const currentTotals = sumByCategoryForMonth(rows, currentMes);
	const previousTotals = previousMes ? sumByCategoryForMonth(rows, previousMes) : {};

	const categories = new Set([...Object.keys(currentTotals), ...Object.keys(previousTotals)]);

	return Array.from(categories)
		.map((categoria) => {
			const current = currentTotals[categoria] ?? 0;
			const previous = previousTotals[categoria] ?? 0;
			return {
				categoria,
				current,
				previous,
				delta: momDelta(current, previous, previousMes != null)
			};
		})
		.sort((a, b) => b.current - a.current);
}
