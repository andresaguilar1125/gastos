import Papa from 'papaparse';
import type { RawRow } from '$lib/types';

/**
 * The published sheet uses these headers (as of 2026-10):
 *   Categoria, Fecha, Persona, Comercio, Descripcion, Monto, Mes,
 *   Grupo, <blank>, Super, Nota
 *
 * `Grupo` is a stray helper column holding "." so it is ignored.
 * `Super` holds the real subcategory (Bebidas, Carnes, ...) but is only
 * populated for the Super category.
 */
export function parseCsv(csvText: string): RawRow[] {
	const parsed = Papa.parse<RawRow>(csvText, {
		header: true,
		dynamicTyping: false,
		skipEmptyLines: 'greedy',
		transformHeader: (header: string) => header.trim().toLowerCase()
	});

	// Drop footer/spacer rows and rows without an amount.
	return parsed.data.filter((row) => {
		const categoria = (row.categoria ?? '').trim();
		const monto = (row.monto ?? '').toString().trim();
		return categoria !== '' && monto !== '';
	});
}
