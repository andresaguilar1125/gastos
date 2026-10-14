import type { NormalizedRow } from '$lib/types';

/**
 * Collapse detailed purchase lines that share the same `Fecha` (datetime) into
 * a single summary row: persona = `Compra`, `comercio` = the first line's,
 * `descripcion` = `Compra Total`, `monto` = the sum of the group. `categoria`,
 * `fecha`, `yearMonth`, `periodo` and `mes` come from the first line.
 *
 * Used by the Super **Historial de compra** table only — every other element
 * keeps the raw detailed rows.
 */
export function groupPurchaseRows(rows: NormalizedRow[]): NormalizedRow[] {
	const groups = new Map<string, NormalizedRow[]>();
	const order: string[] = [];

	for (const row of rows) {
		const key = row.fecha;
		const bucket = groups.get(key);
		if (bucket) bucket.push(row);
		else {
			groups.set(key, [row]);
			order.push(key);
		}
	}

	return order.map((key) => {
		const group = groups.get(key) ?? [];
		const first = group[0];
		return {
			...first,
			persona: 'Compra',
			personaLabel: 'Compra',
			comercio: first.comercio,
			descripcion: 'Compra Total',
			monto: group.reduce((sum, row) => sum + row.monto, 0)
		};
	});
}
