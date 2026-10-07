import Papa from 'papaparse';
import type { RawRow } from '$lib/types';

/**
 * Column layout of the published sheet. Only A–H are read:
 *   A Categoria, B Fecha, C Persona, D Comercio, E Descripcion,
 *   F Monto, G Mes, H Super_Match
 * Columns I–K (`blank`, `Super_Group`, `Super_key`) are a stray catalog and are
 * ignored on purpose — parsing positionally guarantees they can never leak in.
 */
const COLUMNS: (keyof RawRow)[] = [
	'categoria',
	'fecha',
	'persona',
	'comercio',
	'descripcion',
	'monto',
	'mes',
	'superMatch'
];

/**
 * Parse the published CSV into raw A–H rows. We deliberately parse WITHOUT a
 * header row (`header: false`) and slice each row to the first eight cells, so
 * the unrelated catalog columns on the right can never become fields.
 */
export function parseCsv(csvText: string): RawRow[] {
	const parsed = Papa.parse<string[]>(csvText, {
		header: false,
		dynamicTyping: false,
		skipEmptyLines: 'greedy'
	});

	const result: RawRow[] = [];

	parsed.data.forEach((cells, index) => {
		// Skip the header row: the first cell is literally "Categoria".
		if (index === 0 && (cells[0] ?? '').trim().toLowerCase() === 'categoria') return;

		const row = {} as RawRow;
		COLUMNS.forEach((key, i) => {
			row[key] = (cells[i] ?? '').toString().trim();
		});

		// Drop footer/spacer rows and rows without a category or amount.
		if (!row.categoria || !row.monto) return;

		result.push(row);
	});

	return result;
}
