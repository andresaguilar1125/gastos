import { APORTE_SCALE } from '$lib/config';

/**
 * Format a colón amount for display: plain grouped digits (e.g. `55.701`).
 * The UI deliberately avoids the ₡ symbol and k/M abbreviations — full grouped
 * numbers read more clearly in the tables.
 */
export function formatCurrency(amount: number): string {
	return Math.ceil(amount).toLocaleString('de-DE');
}

/** Format an aporte stored in thousands, e.g. `110` → `110` (mil ₡). */
export function formatAporteMillones(aporteMil: number): string {
	return `${aporteMil.toLocaleString('de-DE')}`;
}

/** Convert a real CRC amount back into the thousands used by the inputs. */
export function toDisplayValue(realAmount: number): number {
	return Math.round(realAmount / APORTE_SCALE);
}

/**
 * Format a share of budget (`0.2` → `"20%"`). `null` (no aporte configured)
 * renders as "—".
 */
export function formatPct(value: number | null): string {
	if (value == null) return '—';
	return `${Math.round(value * 100)}%`;
}

/**
 * An amount in **thousands** of colones, rounded up: `48_999` → `"49"`.
 * Matches the thousands scale the aportes are entered in.
 */
export function formatThousands(amount: number): string {
	return Math.ceil(amount / APORTE_SCALE).toLocaleString('de-DE');
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
