<script lang="ts">
	import type { TripGroupStats } from '$lib/types';
	import { formatCurrency } from '$lib/format';

	interface Props {
		stats: TripGroupStats[];
	}

	let { stats }: Props = $props();
</script>

{#if stats.length === 0}
	<p class="text-sm text-gray-500 dark:text-gray-400">Sin viajes registrados.</p>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr
					class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800"
				>
					<th class="py-2 pr-4 font-medium">Persona</th>
					<th class="py-2 pr-4 text-right font-medium">Viajes</th>
					<th class="py-2 pr-4 text-right font-medium">Promedio</th>
					<th class="py-2 pr-4 text-right font-medium">Uber</th>
					<th class="py-2 text-right font-medium">Didi</th>
				</tr>
			</thead>
			<tbody>
				{#each stats as row (row.key)}
					<tr class="border-b border-gray-100 last:border-0 dark:border-gray-800">
						<td class="py-2 pr-4">
							<span class="inline-flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
								<span
									class="h-3 w-1.5 rounded-full"
									style="background-color: {row.color}"
								></span>
								{row.label}
							</span>
						</td>
						<td class="py-2 pr-4 text-right tabular-nums text-gray-700 dark:text-gray-200">
							{row.count}
						</td>
						<td class="py-2 pr-4 text-right tabular-nums font-semibold text-gray-900 dark:text-gray-100">
							{formatCurrency(row.average)}
						</td>
						<td class="py-2 pr-4 text-right tabular-nums text-gray-500 dark:text-gray-400">
							{#if row.uberCount > 0}
								{row.uberCount} · {formatCurrency(row.uberAverage)}
							{:else}
								—
							{/if}
						</td>
						<td class="py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">
							{#if row.didiCount > 0}
								{row.didiCount} · {formatCurrency(row.didiAverage)}
							{:else}
								—
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
		Uber/Didi muestran <span class="font-medium">cantidad · promedio por viaje</span>.
	</p>
{/if}
