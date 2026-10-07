/**
 * Raw shape of one CSV row, limited to columns A–H:
 *   A Categoria, B Fecha, C Persona, D Comercio, E Descripcion,
 *   F Monto, G Mes, H Super_Match
 * Columns I–K (`blank`, `Super_Group`, `Super_key`) are a stray catalog and are
 * deliberately never parsed.
 */
export interface RawRow {
	categoria: string;
	fecha: string;
	persona: string;
	comercio: string;
	descripcion: string;
	monto: string;
	mes: string;
	/** Column H: the real Super aisle, or "null"/"" for non-Super rows. */
	superMatch: string;
}

export interface NormalizedRow {
	/** Raw date string as published, e.g. "06/22/26 09:07 AM". */
	fecha: string;
	/** "YYYY-MM" derived from `fecha` — the ONLY key used for ordering. */
	yearMonth: string;
	/** Month token from the sheet ("Jun"); kept for display only. */
	mes: string;
	categoria: string;
	/** Super aisle (column H); `(Sin categoría)` when null/empty. */
	superMatch: string;
	persona: string;
	/** Display label for the persona, per the labels table. */
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

export interface SuperMatchAggregate {
	superMatch: string;
	sum: number;
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

/**
 * One savings line: a named goal with an icon and a fixed monthly contribution
 * (in thousands of colones). The Ahorros page owns these; they are NOT piggy
 * banks and never appear in the ledger. See `docs/logic.md` §9.
 */
export interface SavingsLine {
	id: string;
	/** Display name, e.g. "Auto" or "Emergencias". */
	name: string;
	/** Lucide export name (see `$lib/ui/icons`), e.g. "Car". */
	icon: string;
	/** Monthly contribution in thousands of colones (APORTE_SCALE). */
	amountMil: number;
}

/** A savings line resolved against the elapsed months. */
export interface SavingsLineProgress {
	line: SavingsLine;
	/** Monthly contribution in real CRC. */
	aporte: number;
	/** aporte × elapsedMonths. */
	acumulado: number;
	/** End-of-year goal: aporte × 12. */
	metaEOY: number;
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

/** One month of the Viajes chart: the per-group sums for a "YYYY-MM" key. */
export interface ViajesMonthPoint {
	yearMonth: string;
	/** Short month token ("Jun") for display. */
	mes: string;
	/** Sum per group key (e.g. `andres`, `mari`, `trabajo`). */
	totals: Record<string, number>;
	/** Total across every group, in CRC. */
	total: number;
}

/** Per-group trip statistics: count and average fare, split by service. */
export interface TripGroupStats {
	key: string;
	label: string;
	color: string;
	/** Every trip row of the group. */
	count: number;
	/** Mean fare of every trip, in CRC (0 when there are no trips). */
	average: number;
	uberCount: number;
	uberAverage: number;
	didiCount: number;
	didiAverage: number;
}
