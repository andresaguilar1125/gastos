export const DATA_URL =
	'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFpRO4TrwAcGggAjB_iZVtdKaKhv59Mhzqy7RhE6JYtYmG704aYHMc6Us1etPgoffJZuLtkk4Ec1fE/pub?output=csv';

export const AHORRO_DUPLICATE_FACTOR = 3;

/**
 * Budgets are a single CAP expressed in thousands of colones: a cap of `70`
 * means "no more than ₡70,000 CRC".
 */
export const BUDGET_SCALE = 1000;

/**
 * Default spending caps per category, expressed in THOUSANDS of colones.
 * Multiply by BUDGET_SCALE to get the real CRC ceiling.
 */
export const DEFAULT_BUDGETS = {
	Recibos: { cap: 110 },
	Restaurantes: { cap: 65 },
	Super: { cap: 230 },
	Familiar: { cap: 95 },
	Medico: { cap: 35 },
	Viajes: { cap: 120 },
	Ahorro: { cap: 600 }
};

export const CATEGORY_COLORS = {
	Familiar: '#f4b400',
	Medico: '#0f9d58',
	Restaurantes: '#7cb342',
	Recibos: '#f9ab00',
	Super: '#f9ab00',
	Viajes: '#f9ab00',
	Ahorro: '#db4437'
};

export type Budget = {
	/** Maximum allowed spend, in thousands of colones. */
	cap: number;
};

export type Budgets = Record<string, Budget>;

export type BudgetStatus = {
	label: string;
	color: string;
	inRange: boolean;
	/** True when spending is above the cap. */
	overMax: boolean;
	/** Percentage of the cap used (rounded, can exceed 100). */
	usedPct: number;
};

/** Convert a cap entered in thousands of colones into a real CRC ceiling. */
export function toRealCap(budget: Budget): number {
	return budget.cap * BUDGET_SCALE;
}

/**
 * Spending is judged against a single **monthly** cap: anything at or under
 * the cap is fine, anything above it is over budget. `budget.cap` is in
 * thousands of colones, so it is scaled before comparing.
 */
export function evaluateSpend(spent: number, budget: Budget): BudgetStatus {
	const cap = toRealCap(budget);
	const overMax = spent > cap;
	const usedPct = cap > 0 ? Math.round((spent / cap) * 100) : 0;
	// Warn once at least 90% of the cap has been used.
	const nearLimit = !overMax && usedPct >= 90;

	return {
		label: overMax ? 'Excedido' : nearLimit ? 'Cerca del tope' : 'Dentro del tope',
		color: overMax ? '#dc2626' : nearLimit ? '#f59e0b' : '#16a34a',
		inRange: !overMax,
		overMax,
		usedPct
	};
}
