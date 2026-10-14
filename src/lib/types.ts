/**
 * Raw shape of one CSV row, limited to columns A–G:
 *   A Categoria, B Fecha, C Persona, D Comercio, E Descripcion, F Monto, G Mes
 * Column C (`Persona`) now carries the category's sub-group (person for
 * Comida/Viajes/Extras, Super aisle for Super). Columns I–J (`Super_Group`,
 * `Super_key`) are a stray catalog and are deliberately never parsed.
 */
export interface RawRow {
	categoria: string;
	fecha: string;
	persona: string;
	comercio: string;
	descripcion: string;
	monto: string;
	mes: string;
}

export interface NormalizedRow {
	/** Raw date string as published, e.g. "06/22/26 09:07 AM". */
	fecha: string;
	/** "YYYY-MM" derived from `fecha` — the ONLY key used for ordering. */
	yearMonth: string;
	/** "YYYYMM-W##" week bucket derived from `fecha` (see `parsePeriodo`). */
	periodo: string;
	/** Month token from the sheet ("Jun"); kept for display only. */
	mes: string;
	categoria: string;
	persona: string;
	/** Display label for the sub-group (column C), resolved per persona rules. */
	personaLabel: string;
	comercio: string;
	descripcion: string;
	/** Signed integer CRC, rounded up. */
	monto: number;
	original: RawRow;
}

export interface CategoryAggregate {
	categoria: string;
	sum: number;
	pct: number;
}

export interface ComercioAggregate {
	comercio: string;
	sum: number;
}

export interface PersonaAggregate {
	persona: string;
	label: string;
	sum: number;
}

export interface MonthAggregate {
	/** "YYYY-MM" key. */
	yearMonth: string;
	/** Short month token ("Jun") for display. */
	mes: string;
	sum: number;
}

/** One piggy bank: a category account with aporte, spend and running balance. */
export interface PiggyBank {
	categoria: string;
	/** Monthly contribution in CRC. */
	aporte: number;
	/** aporte × elapsedMonths. */
	aportado: number;
	/** Σ gasto of the category up to the reference month. */
	gastado: number;
	/** aportado − gastado; may be negative. */
	saldo: number;
	/** esteMes / aporte: share of the month's budget used. null when aporte is 0. */
	budgetPct: number | null;
	/** Number of elapsed months counted for this category. */
	elapsedMonths: number;
	/** Spend of the reference month alone. */
	esteMes: number;
	/** Per-month spend keyed by "YYYY-MM". */
	byMonth: Record<string, number>;
}

/** One cell of the categories × months grid. */
export interface MonthGridCell {
	yearMonth: string;
	gasto: number;
	/** True when `gasto > aporte` and the aporte is configured (> 0). */
	over: boolean;
}

/** One month of a single category's history, for the month-over-month list. */
export interface CategoryMonthPoint {
	/** "YYYY-MM" key. */
	yearMonth: string;
	/** Short month token ("Jun") for display. */
	mes: string;
	gasto: number;
	/** True when `gasto > aporte` and the aporte is configured (> 0). */
	over: boolean;
}

export interface MonthGridRow {
	categoria: string;
	aporte: number;
	cells: MonthGridCell[];
	total: number;
}

export type MomDirection = 'up' | 'down' | 'flat';

export interface MomDelta {
	/** Absolute difference (current - previous). */
	delta: number;
	/** Percentage change vs the previous month, rounded. */
	pct: number;
	direction: MomDirection;
	/** False when there is no previous month to compare against. */
	hasPrevious: boolean;
}

export interface CategoryMom {
	categoria: string;
	current: number;
	previous: number;
	delta: MomDelta;
}

/** Per-label statistics: purchases, total spend and mean value. */
export interface TripGroupStats {
	key: string;
	label: string;
	color: string;
	/** Number of ledger rows of the label. */
	count: number;
	/** Σ spend of the label, in CRC. */
	sum: number;
	/** Mean value of the label, in CRC (0 when there are no rows). */
	average: number;
}

/**
 * One month of a category breakdown chart: the per-label sums for a "YYYY-MM"
 * key. Every breakdown label is a series of its own.
 */
export interface BreakdownMonthPoint {
	yearMonth: string;
	/** Short month token ("Jun") for display. */
	mes: string;
	/** Sum per series label. */
	totals: Record<string, number>;
	/** Total across every series, in CRC. */
	total: number;
}

/** One chart series of a breakdown page. */
export interface BreakdownGroup {
	label: string;
	color: string;
}

/**
 * One side of a comparison (tornado) chart: either a single label or a named
 * group that sums several labels. Colours come from the fixed palette.
 */
export type CompareGroup = string | { label: string; members: string[] };

/** The two sides of a comparison chart, plus an optional card title. */
export interface CompareSpec {
	/** Right side (positive values) in horizontal mode. */
	positive: CompareGroup;
	/** Left side (negative values) in horizontal mode. */
	negative: CompareGroup;
	/** Card title; defaults to "<positive> vs <negative>". */
	title?: string;
}
