import { AHORRO_DUPLICATE_FACTOR } from '$lib/config';
import type {
	CategoryAggregate,
	GrupoAggregate,
	NormalizedRow,
	NotaAggregate,
	PersonaAggregate
} from '$lib/types';

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
