<script lang="ts">
	import type { MonthGridRow } from '$lib/types';
	import { formatCurrency } from '$lib/format';
	import { CATEGORY_COLORS } from '$lib/config';
	import { monthToken } from '$lib/data/aggregates';

	interface Props {
		rows: MonthGridRow[];
		months: string[];
	}

	let { rows, months }: Props = $props();
</script>

<div class="overflow-x-auto">
	<table class="w-full border-collapse text-xs">
		<thead>
			<tr>
				<th
					class="sticky left-0 z-10 bg-white py-2 pr-4 text-left font-medium uppercase tracking-wide text-gray-400 dark:bg-gray-900"
				>
					Categoría
				</th>
				{#each months as yearMonth (yearMonth)}
					<th
						class="px-1.5 py-2 text-center font-medium text-gray-400"
						title={yearMonth}
					>
						{monthToken(yearMonth)}
					</th>
				{/each}
				<th class="py-2 pl-3 text-right font-medium uppercase tracking-wide text-gray-400">
					Total
				</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.categoria)}
				<tr>
					<th
						class="sticky left-0 z-10 whitespace-nowrap bg-white py-1.5 pr-4 text-left font-medium text-gray-900 dark:bg-gray-900 dark:text-gray-100"
					>
						<span class="inline-flex items-center gap-2">
							<span
								class="h-3 w-1.5 rounded-full"
								style="background-color: {CATEGORY_COLORS[row.categoria] ?? '#94a3b8'}"
							></span>
							{row.categoria}
						</span>
					</th>
					{#each row.cells as cell (cell.yearMonth)}
						<td
							class="px-1.5 py-1.5 text-center tabular-nums {cell.over
								? 'rounded bg-red-100 font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300'
								: cell.gasto > 0
									? 'text-gray-700 dark:text-gray-200'
									: 'text-gray-300 dark:text-gray-600'}"
							title="{cell.yearMonth}: {formatCurrency(cell.gasto)}"
						>
							{cell.gasto > 0 ? formatCurrency(cell.gasto) : '·'}
						</td>
					{/each}
					<td class="py-1.5 pl-3 text-right font-semibold tabular-nums text-gray-700 dark:text-gray-200">
						{formatCurrency(row.total)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
