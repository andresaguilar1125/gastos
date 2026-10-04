import type { NormalizedRow, RawRow } from '$lib/types';

/** Canonical category names (title-cased, accents removed where needed). */
const CATEGORY_ALIASES: Record<string, string> = {
	familiar: 'Familiar',
	medico: 'Medico',
	'médico': 'Medico',
	restaurantes: 'Restaurantes',
	recibos: 'Recibos',
	super: 'Super',
	viajes: 'Viajes',
	ahorro: 'Ahorro',
	ahorros: 'Ahorro'
};

/** Person names are normalized by stripping the trailing "#" marker. */
const PERSONA_ALIASES: Record<string, string> = {
	andres: 'Andres',
	'andres#': 'Andres',
	mari: 'Mari',
	'mari#': 'Mari',
	trabajo: 'Trabajo',
	casa: 'Casa',
	marvin: 'Marvin'
};

/**
 * Parse an amount like "5,600" or "5600" into an integer CRC value,
 * always rounded up.
 */
export function parseMonto(value: string | number | undefined | null): number {
	if (value == null) return NaN;
	if (typeof value === 'number') return Number.isFinite(value) ? Math.ceil(value) : NaN;

	// Remove currency symbols and thousand separators, keep digits and sign.
	const cleaned = value.toString().replace(/[^\d.-]/g, '');
	if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;

	const num = Number(cleaned);
	return Number.isFinite(num) ? Math.ceil(num) : NaN;
}

export function normalizeRows(rows: RawRow[]): NormalizedRow[] {
	const result: NormalizedRow[] = [];

	for (const row of rows) {
		const monto = parseMonto(row.monto);
		const rawCategory = (row.categoria ?? '').trim();
		const categoria =
			CATEGORY_ALIASES[rawCategory.toLowerCase()] ??
			(rawCategory ? rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1) : '');

		if (!categoria || Number.isNaN(monto)) continue;

		const rawPersona = (row.persona ?? '').trim();
		const persona =
			PERSONA_ALIASES[rawPersona.toLowerCase()] ??
			(rawPersona ? rawPersona.charAt(0).toUpperCase() + rawPersona.slice(1) : '');

		// `Super` holds the real subcategory for Super rows.
		const rawGrupo = (row.super ?? row.subcategoria ?? '').trim();
		const grupo = rawGrupo === '.' ? '' : rawGrupo;

		result.push({
			fecha: (row.fecha ?? '').trim(),
			mes: (row.mes ?? '').trim(),
			categoria,
			grupo,
			persona,
			comercio: (row.comercio ?? '').trim(),
			descripcion: (row.descripcion ?? '').trim(),
			nota: (row.nota ?? row.descripcion ?? '').trim(),
			monto,
			original: row
		});
	}

	return result;
}
