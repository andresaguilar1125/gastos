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
 * `Persona` (column C) now carries the category's sub-group: the person for
 * Comida/Viajes/Extras, the Super aisle for Super. Values arrive already
 * finalized, so only accented names need a label; everything else is title-cased.
 */
const PERSONA_LABELS: Record<string, string> = {
	andres: 'Andrés'
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

/**
 * Derive the billing period from the sheet's `Fecha`: each month is split into
 * four week buckets — 01–07 → W01, 08–14 → W02, 15–21 → W03, 22–31 → W04 — and
 * rendered as `YYYYMM-W##` (e.g. "06/22/26 …" → "202606-W04").
 */
export function parsePeriodo(fecha: string): string {
	if (!fecha) return '';
	const match = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
	if (!match) return '';
	const [, monthRaw, dayRaw, yearRaw] = match;
	const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
	const mm = Number(monthRaw);
	const dd = Number(dayRaw);
	if (!Number.isFinite(year) || !Number.isFinite(mm) || mm < 1 || mm > 12) return '';
	if (!Number.isFinite(dd) || dd < 1 || dd > 31) return '';
	const week = dd <= 7 ? 1 : dd <= 14 ? 2 : dd <= 21 ? 3 : 4;
	return `${year}${String(mm).padStart(2, '0')}-W${String(week).padStart(2, '0')}`;
}

/**
 * Derive a **sortable** key from the sheet's `Fecha`, e.g.
 * `"06/22/26 09:07 AM"` → `"202606220907"`. The raw string is M/D/YY, so it
 * cannot be sorted as text; this normalises it to `YYYYMMDDHHmm` (24h). Returns
 * `''` when the date cannot be parsed.
 */
export function datetimeKey(fecha: string): string {
	const match = fecha.match(
		/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})\s*([AP]M)?)?/i
	);
	if (!match) return '';
	const [, monthRaw, dayRaw, yearRaw, hourRaw, minuteRaw, meridiem] = match;
	const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
	let hours = Number(hourRaw ?? 0);
	const minutes = Number(minuteRaw ?? 0);
	if (meridiem) {
		const upper = meridiem.toUpperCase();
		if (upper === 'PM' && hours < 12) hours += 12;
		if (upper === 'AM' && hours === 12) hours = 0;
	}
	const pad = (value: number) => String(value).padStart(2, '0');
	return `${year}${pad(Number(monthRaw))}${pad(Number(dayRaw))}${pad(hours)}${pad(minutes)}`;
}

/** Title-case a fallback value that has no alias. */
function titleCase(value: string): string {
	return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
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
			periodo: parsePeriodo(row.fecha ?? ''),
			mes: (row.mes ?? '').trim(),
			categoria,
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
