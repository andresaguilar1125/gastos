import type { NormalizedRow, SavingsLine, SavingsLineProgress } from '$lib/types';
import { APORTE_SCALE, SAVINGS_CATEGORY } from '$lib/config';
import { elapsedMonths } from '$lib/budget/piggy';

/**
 * Months elapsed for the Ahorros plan. Savings have no ledger rows, so they are
 * anchored to the **global epoch** and reset every January (see `docs/logic.md`
 * §9). This simply forwards to `elapsedMonths`, which already special-cases
 * `SAVINGS_CATEGORY`.
 */
export function savingsMonths(rows: NormalizedRow[], refYearMonth: string | null): number {
	return elapsedMonths(rows, SAVINGS_CATEGORY, refYearMonth);
}

/**
 * Resolve every savings line against the elapsed months.
 *
 *   aporte    = amountMil × APORTE_SCALE
 *   acumulado = aporte × months
 *   metaEOY   = aporte × 12
 */
export function savingsProgress(
	lines: SavingsLine[],
	months: number
): SavingsLineProgress[] {
	return lines.map((line) => {
		const aporte = Math.max(0, Math.round(line.amountMil)) * APORTE_SCALE;
		return {
			line,
			aporte,
			acumulado: aporte * months,
			metaEOY: aporte * 12
		};
	});
}

export interface SavingsTotals {
	/** Σ monthly contributions, in real CRC. */
	aporteMensual: number;
	/** Σ accumulated (aporte × months). */
	acumulado: number;
	/** Σ end-of-year goals (aporte × 12). */
	metaEOY: number;
	/** Months elapsed this year. */
	months: number;
	/** Month progress toward the year goal, clamped to 100. */
	progressPct: number;
}

/** Aggregate the per-line progress into the page totals. */
export function savingsTotals(
	progress: SavingsLineProgress[],
	months: number
): SavingsTotals {
	const aporteMensual = progress.reduce((sum, p) => sum + p.aporte, 0);
	const acumulado = progress.reduce((sum, p) => sum + p.acumulado, 0);
	const metaEOY = progress.reduce((sum, p) => sum + p.metaEOY, 0);
	return {
		aporteMensual,
		acumulado,
		metaEOY,
		months,
		progressPct: Math.min(100, Math.round((months / 12) * 100))
	};
}
