<script lang="ts">
	import type { TripGroupStats } from '$lib/types';
	import { formatCurrency, roundUpTo } from '$lib/format';

	/** Rounded to the next 10 colones for a tidy, easy-to-scan table. */
	const STEP = 10;

	interface Props {
		stats: TripGroupStats[];
		/** Header for the label column ("Persona" on Viajes, "Categoría" on Super). */
		labelHeader?: string;
		/** Header for the count column ("Viajes" / "Compras"). */
		countHeader?: string;
		/** Shown when there are no rows (plural noun differs per page). */
		emptyLabel?: string;
	}

	let {
		stats,
		labelHeader = 'Persona',
		countHeader = 'Viajes',
		emptyLabel = 'Sin viajes registrados.'
	}: Props = $props();

	/** Grand total across every row, so the table reconciles with the chart. */
	const total = $derived(
		stats.reduce((acc, row) => ({ count: acc.count + row.count, sum: acc.sum + row.sum }), {
			count: 0,
			sum: 0
		})
	);
	/** Footer "Promedio": the sum of every row's (rounded) average. */
	const totalPromedio = $derived(
		stats.reduce((acc, row) => acc + (row.count > 0 ? roundUpTo(row.average, STEP) : 0), 0)
	);
</script>

{#if stats.length === 0}
	<p class="text-sm text-accent-4">{emptyLabel}</p>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr
					class="border-b border-accent-4/20 text-left text-xs uppercase tracking-wide text-accent-4/70"
				>
					<th class="py-2 pr-4 font-medium">{labelHeader}</th>
					<th class="py-2 pr-4 text-right font-medium">{countHeader}</th>
					<th class="py-2 pr-4 text-right font-medium">Promedio</th>
					<th class="py-2 text-right font-medium">Suma</th>
				</tr>
			</thead>
			<tbody>
				{#each stats as row (row.key)}
					<tr class="border-b border-accent-4/10 last:border-0">
						<td class="py-2 pr-4">
							<span class="inline-flex items-center gap-2 text-accent-5">
								<span class="h-3 w-1.5 rounded-full" style="background-color: {row.color}"></span>
								{row.label}
							</span>
						</td>
						<td class="py-2 pr-4 text-right tabular-nums text-accent-4">
							{row.count}
						</td>
						<td class="py-2 pr-4 text-right tabular-nums text-accent-5">
							{#if row.count > 0}
								{formatCurrency(roundUpTo(row.average, STEP))}
							{:else}
								—
							{/if}
						</td>
						<td class="py-2 text-right tabular-nums text-accent-4">
							{formatCurrency(roundUpTo(row.sum, STEP))}
						</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="border-t border-accent-4/20 text-accent-5">
					<td class="py-2 pr-4">Total</td>
					<td class="py-2 pr-4 text-right tabular-nums">{total.count}</td>
					<td class="py-2 pr-4 text-right tabular-nums">
						{formatCurrency(totalPromedio)}
					</td>
					<td class="py-2 text-right tabular-nums">
						{formatCurrency(roundUpTo(total.sum, STEP))}
					</td>
				</tr>
			</tfoot>
		</table>
	</div>
{/if}
