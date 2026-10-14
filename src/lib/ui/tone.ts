/**
 * Shared colour tones for budget progress UI. `pct` is the share of the month's
 * budget spent (`gasto / aporte`); `null` means no budget is configured.
 *
 * Thresholds: success ≤ 50%, warning ≤ 85%, danger above.
 */

/** Pill / text tone for a budget percentage. */
export function pctTone(pct: number | null): string {
	if (pct == null) return 'bg-accent-4/10 text-accent-4';
	if (pct > 0.85) return 'bg-danger/10 text-danger';
	if (pct > 0.5) return 'bg-warning/20 text-accent-5';
	return 'bg-accent-1/10 text-accent-1';
}

/** Solid progress-bar fill matching `pctTone`. */
export function barTone(pct: number | null): string {
	if (pct == null) return 'bg-accent-4/25';
	if (pct > 0.85) return 'bg-danger';
	if (pct > 0.5) return 'bg-warning';
	return 'bg-accent-1';
}

/** Text-only variant used inside table cells. */
export function pctTextTone(pct: number | null): string {
	if (pct == null) return 'text-accent-4';
	if (pct > 0.85) return 'font-semibold text-danger';
	if (pct > 0.5) return 'font-semibold text-accent-5';
	return 'text-accent-4';
}
