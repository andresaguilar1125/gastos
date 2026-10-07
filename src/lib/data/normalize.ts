import type { NormalizedRow, RawRow } from '$lib/types';

/** Canonical category names. */
const CATEGORY_ALIASES: Record<string, string> = {
	comida: 'Comida',
	extras: 'Extras',
	recibos: 'Recibos',
	super: 'Super',
	viajes: 'Viajes',
	ahorro: 'Ahorros',
	ahorros: 'Ahorros'
};

/**
 * `Persona` identifies *who* the money was for. The raw value is preserved, and
 * a trailing `#` marks "not the default person, keep it separate" (see the
 * labels table in `logic.md` §7).
 */
const PERSONA_LABELS: Record<string, string> = {
	andres: 'Andrés',
	'andres#': 'Salidas',
	mari: 'Mari',
	'mari#': 'Citas',
	trabajo: 'Trabajo',
	casa: 'Casa',
	marvin: 'Marvin'
};

/**
 * Parse an amount like "5,600" or "5600" into an integer CRC value, always
 * rounded up. The value is treated as **signed**: no negatives exist today, but
 * a future adjustments table can feed it without changes.
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

/**
 * Derive `YYYY-MM` from the sheet's `Fecha` (e.g. "06/22/26 09:07 AM" →
 * "2026-06"). `Mes` carries no year, so it can never order data across years;
 * `yearMonth` is the ONLY key used for ordering, filtering and comparison.
 */
export function parseYearMonth(fecha: string): string {
	if (!fecha) return '';
	// `Fecha` is M/D/YY (e.g. "06/22/26 09:07 AM") → groups: 1=month, 2=day, 3=year.
	const match = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
	if (!match) return '';
	const [, month, , yearRaw] = match;
	const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
	const mm = Number(month);
	if (!Number.isFinite(year) || !Number.isFinite(mm) || mm < 1 || mm > 12) return '';
	return `${year}-${String(mm).padStart(2, '0')}`;
}

/** Title-case a fallback value that has no alias. */
function titleCase(value: string): string {
	return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

/**
 * Column H: the real Super aisle. For non-Super rows the sheet publishes the
 * literal string `null` (or a stray `.`), which become the `(Sin categoría)`
 * bucket. This is expected — most Super rows carry no subcategory.
 */
export function normalizeSuperMatch(raw: string): string {
	const value = (raw ?? '').trim();
	if (value === '' || value.toLowerCase() === 'null' || value === '.') return '(Sin categoría)';
	return value;
}

export function normalizeRows(rows: RawRow[]): NormalizedRow[] {
	const result: NormalizedRow[] = [];

	for (const row of rows) {
		const monto = parseMonto(row.monto);
		const rawCategory = (row.categoria ?? '').trim();
		const categoria = CATEGORY_ALIASES[rawCategory.toLowerCase()] ?? titleCase(rawCategory);

		if (!categoria || Number.isNaN(monto)) continue;

		const rawPersona = (row.persona ?? '').trim();
		const personaLabel = PERSONA_LABELS[rawPersona.toLowerCase()] ?? titleCase(rawPersona);

		result.push({
			fecha: (row.fecha ?? '').trim(),
			yearMonth: parseYearMonth(row.fecha ?? ''),
			mes: (row.mes ?? '').trim(),
			categoria,
			superMatch: normalizeSuperMatch(row.superMatch ?? ''),
			persona: rawPersona,
			personaLabel,
			comercio: (row.comercio ?? '').trim(),
			descripcion: (row.descripcion ?? '').trim(),
			monto,
			original: row
		});
	}

	return result;
}
