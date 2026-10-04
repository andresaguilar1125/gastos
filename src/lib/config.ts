export const DATA_URL =
	'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFpRO4TrwAcGggAjB_iZVtdKaKhv59Mhzqy7RhE6JYtYmG704aYHMc6Us1etPgoffJZuLtkk4Ec1fE/pub?output=csv';

export const AHORRO_DUPLICATE_FACTOR = 3;

/**
 * Budgets are entered in thousands of colones. Selecting 50 -> 70 means
 * a range of ₡50,000 -> ₡70,000 CRC.
 */
export const BUDGET_SCALE = 1000;

/**
 * Default budget ranges per category, expressed in THOUSANDS of colones.
 * Multiply by BUDGET_SCALE to get the real CRC amount.
 * These are rough starting points based on the monthly average of the
 * historic data; adjust them in Configuración to match your real targets.
 */
export const DEFAULT_BUDGETS = {
	Recibos: { min: 70, max: 110 },
	Restaurantes: { min: 35, max: 65 },
	Super: { min: 150, max: 230 },
	Familiar: { min: 50, max: 95 },
	Medico: { min: 10, max: 35 },
	Viajes: { min: 70, max: 120 },
	Ahorro: { min: 400, max: 600 }
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
	/** Lower bound in thousands of colones. */
	min: number;
	/** Upper bound in thousands of colones. */
	max: number;
};

export type Budgets = Record<string, Budget>;
