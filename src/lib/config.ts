export const DATA_URL =
	'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFpRO4TrwAcGggAjB_iZVtdKaKhv59Mhzqy7RhE6JYtYmG704aYHMc6Us1etPgoffJZuLtkk4Ec1fE/pub?output=csv';

export const AHORRO_DUPLICATE_FACTOR = 3;

export const DEFAULT_BUDGETS = {
	Recibos: { min: 500, max: 600, mode: 'exhaust' as const },
	Restaurantes: { min: 0, max: 60, mode: 'cap' as const },
	Super: { min: 0, max: 200, mode: 'cap' as const },
	Familiar: { min: 50, max: 150, mode: 'range' as const },
	Medico: { min: 0, max: 50, mode: 'range' as const },
	Viajes: { min: 0, max: 150, mode: 'range' as const },
	Ahorro: { min: 400, max: 600, mode: 'target' as const }
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

export type BudgetMode = 'exhaust' | 'cap' | 'range' | 'target';

export type Budget = {
	min: number;
	max: number;
	mode: BudgetMode;
};

export type Budgets = Record<string, Budget>;
