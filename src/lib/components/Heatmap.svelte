<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import { monthToken } from '$lib/data/aggregates';

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
	}

	let {
		months,
		rows,
		format = formatCurrency,
		labelHeader = 'Concepto',
		highlight = null
	}: Props = $props();

	/** Highest cell in the whole grid — the anchor for the colour scale. */
	const max = $derived(Math.max(0, ...rows.flatMap((row) => row.values)));
	const totals = $derived(rows.map((row) => row.values.reduce((a, b) => a + b, 0)));

	/**
	 * Colour ramp by intensity (value ÷ grid max). Zero values stay neutral so
	 * "no spend" reads as empty rather than as a low-intensity cell.
	 */
	function cellClass(value: number): string {
		const base = 'rounded-md px-1.5 py-1.5 text-center text-[11px] tabular-nums';
		if (value <= 0 || max <= 0) return `${base} text-gray-300 dark:text-gray-600`;
		const t = value / max;
		const tone =
			t > 0.75
				? 'bg-blue-800 text-blue-50 dark:bg-blue-600/80 dark:text-blue-50'
				: t > 0.5
					? 'bg-blue-600 text-white dark:bg-blue-700/70 dark:text-blue-50'
					: t > 0.25
						? 'bg-blue-400 text-blue-950 dark:bg-blue-900/60 dark:text-blue-100'
						: 'bg-blue-50 text-gray-700 dark:bg-blue-950/40 dark:text-gray-300';
		return `${base} ${tone}`;
	}
</script>

{#if rows.length === 0 || months.length === 0}
	<p class="text-sm text-gray-500 dark:text-gray-400">Sin movimientos para esta categoría.</p>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full border-separate border-spacing-x-0.5 border-spacing-y-1 text-xs">
			<thead>
				<tr class="text-left text-[11px] uppercase tracking-wide text-gray-400">
					<th
						class="sticky left-0 z-10 bg-white pr-2 font-medium dark:bg-gray-900"
					>
						{labelHeader}
					</th>
					{#each months as yearMonth (yearMonth)}
						<th
							class="px-1 py-1 text-center font-medium {yearMonth === highlight
								? 'text-gray-900 dark:text-gray-100'
								: ''}"
							title={yearMonth}
						>
							{monthToken(yearMonth)}
						</th>
					{/each}
					<th class="pl-2 text-right font-medium">Total</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row, i (row.label)}
					<tr>
						<th
							class="sticky left-0 z-10 max-w-28 truncate bg-white pr-2 text-left font-medium text-gray-900 dark:bg-gray-900 dark:text-gray-100"
							title={row.label}
						>
							{row.label}
						</th>
						{#each row.values as value, j (months[j])}
							<td
								class={cellClass(value)}
								title="{months[j]}: {formatCurrency(value)}"
							>
								{value > 0 ? format(value) : '·'}
							</td>
						{/each}
						<td
							class="pl-2 text-right font-semibold tabular-nums text-gray-700 dark:text-gray-200"
							title={formatCurrency(totals[i])}
						>
							{format(totals[i])}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
