<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import { monthToken } from '$lib/data/aggregates';

	/** Neutral grid lines between every cell. */
	const GRID = 'border border-accent-4/15';

	interface Props {
		/** Column keys, chronological ("YYYY-MM"). */
		months: string[];
		/** One row per label; `values` aligns 1:1 with `months`. */
		rows: { label: string; values: number[] }[];
		/** Cell label formatter (defaults to full currency). */
		format?: (value: number) => string;
		/** Column header for the label column. */
		labelHeader?: string;
		/** A month key to emphasise (usually the reference month). */
		highlight?: string | null;
		/** Append a footer row with the per-month totals. */
		showTotalRow?: boolean;
		/**
		 * Cell intensity reference: `global` scales every cell by the biggest
		 * cell in the grid; `row` scales each row by its own max, so one dominant
		 * label can't flatten the whole matrix.
		 */
		normalize?: 'global' | 'row';
	}

	let {
		months,
		rows,
		format = formatCurrency,
		labelHeader = 'Concepto',
		highlight = null,
		showTotalRow = false,
		normalize = 'global'
	}: Props = $props();

	/** Highest cell in the whole grid — the anchor for the global colour scale. */
	const max = $derived(Math.max(0, ...rows.flatMap((row) => row.values)));

	/** Highest cell in each row — the anchor for the per-row colour scale. */
	const rowMaxima = $derived(rows.map((row) => Math.max(0, ...row.values)));

	const totals = $derived(rows.map((row) => row.values.reduce((a, b) => a + b, 0)));

	/** Sum per column, for the optional footer row. */
	const columnTotals = $derived(
		months.map((_, index) => rows.reduce((sum, row) => sum + (row.values[index] ?? 0), 0))
	);
	const grandTotal = $derived(columnTotals.reduce((a, b) => a + b, 0));

	/** The single highest month total — the only footer value shown in danger text. */
	const peakColumn = $derived(Math.max(0, ...columnTotals));

	/**
	 * Intensity colour (`value ÷ reference`): **green → teal → deep blue**, three
	 * discrete buckets with no in-between gradient. Zero values stay neutral so
	 * "no spend" reads as empty rather than as a low-intensity cell.
	 */
	function cellClass(value: number, rowMax: number): string {
		const base = `${GRID} px-2 py-2 text-center text-[11px] font-semibold tabular-nums`;
		const reference = normalize === 'row' ? rowMax : max;
		if (value <= 0 || reference <= 0) return `${base} text-accent-4/50`;
		const t = value / reference;
		const tone =
			t >= 0.8
				? 'bg-danger text-white'
				: t >= 0.5
					? 'bg-warning text-accent-5'
					: 'bg-success text-white';
		return `${base} ${tone}`;
	}
</script>

{#if rows.length === 0 || months.length === 0}
	<p class="text-sm text-accent-4">Sin movimientos para esta categoría.</p>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full border-collapse text-xs">
			<thead>
				<tr class="text-left text-[11px] uppercase tracking-wide text-white">
					<th class="{GRID} sticky left-0 z-10 bg-accent-5 px-2 font-medium">
						{labelHeader}
					</th>
					{#each months as yearMonth (yearMonth)}
						<th
							class="{GRID} bg-accent-5 px-2 py-2 text-center font-medium {yearMonth === highlight
								? 'font-semibold'
								: ''}"
							title={yearMonth}
						>
							{monthToken(yearMonth)}
						</th>
					{/each}
					<th class="{GRID} bg-accent-5 px-2 text-right font-medium">Total</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row, i (row.label)}
					<tr>
						<th
							class="{GRID} sticky left-0 z-10 max-w-28 truncate bg-white px-2 text-left font-medium text-accent-5"
							title={row.label}
						>
							{row.label}
						</th>
						{#each row.values as value, j (months[j])}
							<td
								class={cellClass(value, rowMaxima[i])}
								title="{months[j]}: {formatCurrency(value)}"
							>
								{value > 0 ? format(value) : '·'}
							</td>
						{/each}
						<td
							class="{GRID} px-2 text-right font-semibold tabular-nums text-accent-4"
							title={formatCurrency(totals[i])}
						>
							{format(totals[i])}
						</td>
					</tr>
				{/each}
			</tbody>
			{#if showTotalRow}
				<tfoot>
					<tr>
						<th
							class="{GRID} sticky left-0 z-10 bg-white px-2 text-left font-semibold text-accent-4"
						>
							Total
						</th>
						{#each columnTotals as value, j (months[j])}
							{@const peak = value > 0 && value === peakColumn}
							<td
								class="{GRID} px-2 py-2 text-center font-semibold tabular-nums {peak
									? 'text-danger '
									: 'text-accent-4 '}"
								title="{months[j]}: {formatCurrency(value)}"
							>
								{value > 0 ? format(value) : '·'}
							</td>
						{/each}
						<td
							class="{GRID} px-2 text-right font-semibold tabular-nums text-accent-5"
							title={formatCurrency(grandTotal)}
						>
							{format(grandTotal)}
						</td>
					</tr>
				</tfoot>
			{/if}
		</table>
	</div>
{/if}
