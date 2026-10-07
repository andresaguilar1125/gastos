<script lang="ts">
	import { formatCurrency } from '$lib/format';

	interface Props {
		data: { label: string; sum: number }[];
		/** Column header for the label column. */
		labelHeader?: string;
		/** Rows shown before truncating (0 = all). */
		limit?: number;
	}

	let { data, labelHeader = 'Concepto', limit = 0 }: Props = $props();

	const visible = $derived(limit > 0 ? data.slice(0, limit) : data);
	const grand = $derived(data.reduce((sum, d) => sum + d.sum, 0));
	const max = $derived(Math.max(1, ...data.map((d) => d.sum)));
</script>

{#if visible.length === 0}
	<p class="text-sm text-gray-500 dark:text-gray-400">Sin movimientos para esta categoría.</p>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr
					class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800"
				>
					<th class="py-2 pr-4 font-medium">{labelHeader}</th>
					<th class="py-2 pl-4 text-right font-medium">Monto</th>
					<th class="py-2 pl-4 text-right font-medium">%</th>
				</tr>
			</thead>
			<tbody>
				{#each visible as row (row.label)}
					<tr class="border-b border-gray-100 last:border-0 dark:border-gray-800">
						<td class="py-2 pr-4">
							<p class="truncate font-medium text-gray-900 dark:text-gray-100">{row.label}</p>
							<div class="mt-1 h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
								<div
									class="h-full rounded-full bg-primary"
									style="width: {Math.round((row.sum / max) * 100)}%"
								></div>
							</div>
						</td>
						<td class="py-2 pl-4 text-right tabular-nums text-gray-700 dark:text-gray-200">
							{formatCurrency(row.sum)}
						</td>
						<td class="py-2 pl-4 text-right tabular-nums text-gray-500 dark:text-gray-400">
							{grand ? Math.round((row.sum / grand) * 100) : 0}%
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
