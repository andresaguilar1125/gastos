import { BUDGET_SCALE } from '$lib/config';
import type { Budget, BudgetStatus } from '$lib/types';

export function formatCurrency(amount: number): string {
	return `₡${Math.ceil(amount).toLocaleString('es-CR')}`;
}

/** Convert a range entered in thousands of colones into real CRC values. */
export function toRealRange(budget: Budget): { min: number; max: number } {
	return { min: budget.min * BUDGET_SCALE, max: budget.max * BUDGET_SCALE };
}

/** Convert a real CRC amount back into the thousands used by the inputs. */
export function toDisplayValue(realAmount: number): number {
	return Math.round(realAmount / BUDGET_SCALE);
}

/**
 * Spending is always judged against a range: below `min` is low, above `max`
 * is high, and anything in between is on target. `budget.min`/`max` are in
 * thousands of colones, so they are scaled before comparing.
 */
export function evaluateSpend(spent: number, budget: Budget): BudgetStatus {
	const { min, max } = toRealRange(budget);
	const inRange = spent >= min && spent <= max;
	const overMax = spent > max;

	return {
		label: inRange ? 'En rango' : overMax ? 'Sobre rango' : 'Por debajo',
		color: inRange ? '#16a34a' : overMax ? '#dc2626' : '#f59e0b',
		inRange,
		belowMin: spent < min,
		overMax
	};
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
