<script lang="ts">
	import type { PiggyBank } from '$lib/types';
	import { formatCurrency, formatPct } from '$lib/format';
	import { CATEGORY_COLORS } from '$lib/config';

	interface Props {
		banks: PiggyBank[];
		/** Highlight one category (optional). */
		highlight?: string | null;
	}

	let { banks, highlight = null }: Props = $props();

	function saldoClass(saldo: number): string {
		if (saldo < 0) return 'font-semibold text-red-600 dark:text-red-400';
		if (saldo > 0) return 'font-semibold text-green-600 dark:text-green-400';
		return 'font-medium text-gray-500 dark:text-gray-400';
	}

	/** Gastado figure is colour-coded by share of the month's budget. */
	function pctClass(pct: number | null): string {
		if (pct == null) return 'text-gray-700 dark:text-gray-200';
		if (pct > 0.85) return 'font-semibold text-red-600 dark:text-red-400';
		if (pct > 0.5) return 'font-semibold text-amber-600 dark:text-amber-400';
		return 'text-gray-700 dark:text-gray-200';
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full text-sm">
		<thead>
			<tr
				class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800"
			>
				<th class="py-2 pr-4 font-medium">Categoría</th>
				<th class="py-2 pr-4 text-right font-medium">Aporte</th>
				<th class="py-2 pr-4 text-right font-medium">Gastado</th>
				<th class="py-2 pr-4 text-right font-medium">% este mes</th>
				<th class="py-2 text-right font-medium">Saldo</th>
			</tr>
		</thead>
		<tbody>
			{#each banks as bank (bank.categoria)}
				<tr
					class="border-b border-gray-100 last:border-0 dark:border-gray-800 {bank.categoria ===
					highlight
						? 'bg-primary/5'
						: ''}"
				>
					<td class="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">
						<span class="inline-flex items-center gap-2">
							<span
								class="h-3 w-1.5 rounded-full"
								style="background-color: {CATEGORY_COLORS[bank.categoria] ?? '#94a3b8'}"
							></span>
							{bank.categoria}
						</span>
					</td>
					<td class="py-2 pr-4 text-right tabular-nums text-gray-500 dark:text-gray-400">
						{bank.aporte > 0 ? formatCurrency(bank.aporte) : '—'}
					</td>
					<td class="py-2 pr-4 text-right tabular-nums {pctClass(bank.budgetPct)}">
						{formatCurrency(bank.esteMes)}
					</td>
					<td class="py-2 pr-4 text-right tabular-nums {pctClass(bank.budgetPct)}">
						{formatPct(bank.budgetPct)}
					</td>
					<td class="py-2 text-right tabular-nums {saldoClass(bank.saldo)}">
						{formatCurrency(bank.saldo)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
