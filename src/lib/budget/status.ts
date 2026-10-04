import { BUDGET_SCALE, evaluateSpend, toRealCap } from '$lib/config';

export { evaluateSpend, toRealCap };

export function formatCurrency(amount: number): string {
	return `₡${Math.ceil(amount).toLocaleString('es-CR')}`;
}

/** Convert a real CRC amount back into the thousands used by the inputs. */
export function toDisplayValue(realAmount: number): number {
	return Math.round(realAmount / BUDGET_SCALE);
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
