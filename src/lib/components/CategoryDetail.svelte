<script lang="ts">
	import { dataStore } from '$lib/stores/index.svelte';
	import { formatCurrency, formatPct, formatThousands } from '$lib/format';
	import { formatYearMonth, monthMapForCategory, momDelta } from '$lib/data/aggregates';
	import { categoryMonthSeries } from '$lib/budget/piggy';
	import Card from '$lib/components/Card.svelte';
	import DeltaBadge from '$lib/components/DeltaBadge.svelte';
	import BreakdownTable from '$lib/components/BreakdownTable.svelte';
	import Heatmap from '$lib/components/Heatmap.svelte';

	interface Props {
		categoria: string;
		/** Breakdown dimension for the detail table. */
		breakdown?: 'comercio' | 'superMatch' | 'persona';
		/** Noun used in the KPI copy, e.g. "Gasto" or "Ahorro". */
		amountLabel?: string;
	}

	let { categoria, breakdown = 'comercio', amountLabel = 'Gasto' }: Props = $props();

	const bank = $derived(dataStore.piggyBanks.find((b) => b.categoria === categoria));
	const aporte = $derived(bank?.aporte ?? 0);

	const categoryRows = $derived(
		dataStore.rows.filter((r) => r.categoria.toLowerCase() === categoria.toLowerCase())
	);

	/** Monthly totals for this category, chronological. */
	const monthSums = $derived.by(() => {
		const map = monthMapForCategory(dataStore.rows, categoria);
		return Object.entries(map)
			.map(([yearMonth, sum]) => ({ yearMonth, sum }))
			.sort((a, b) => (a.yearMonth < b.yearMonth ? -1 : 1));
	});

	const mom = $derived.by(() => {
		if (monthSums.length === 0) return momDelta(0, 0, false);
		const ref = dataStore.refMonth;
		const idx = monthSums.findIndex((m) => m.yearMonth === ref);
		const current = idx >= 0 ? monthSums[idx] : monthSums[monthSums.length - 1];
		const previous = idx > 0 ? monthSums[idx - 1] : null;
		return momDelta(current.sum, previous?.sum ?? 0, previous != null);
	});

	/** Spend of the reference month (the "Gastado" figure everywhere). */
	const gastoMes = $derived(bank?.esteMes ?? 0);
	/** Share of the monthly budget used; null when no aporte is configured. */
	const budgetPct = $derived(bank?.budgetPct ?? null);
	/** What is left of this month's budget (negative when over). */
	const restante = $derived(aporte > 0 ? aporte - gastoMes : null);
	/** Share of the budget still available (absolute value when over). */
	const restantePct = $derived(budgetPct == null ? null : Math.abs(1 - budgetPct));

	/** Last 6 months of this category, with the over-budget flag. */
	const monthSeries = $derived(categoryMonthSeries(dataStore.rows, categoria, aporte, 6));
	/** Month keys used by both heatmaps, so they always line up. */
	const heatMonths = $derived(monthSeries.map((point) => point.yearMonth));

	/** The breakdown rows for the chosen dimension. */
	const breakdownRows = $derived.by(() => {
		const totals: Record<string, number> = {};
		for (const row of categoryRows) {
			const value =
				breakdown === 'persona'
					? row.personaLabel
					: breakdown === 'superMatch'
						? row.superMatch
						: row.comercio || 'Sin comercio';
			const label =
				value.trim() ||
				(breakdown === 'persona'
					? 'Sin persona'
					: breakdown === 'superMatch'
						? '(Sin categoría)'
						: 'Sin comercio');
			totals[label] = (totals[label] ?? 0) + row.monto;
		}
		return Object.entries(totals)
			.map(([label, sum]) => ({ label, sum }))
			.sort((a, b) => b.sum - a.sum);
	});

	const breakdownLabel = $derived(
		breakdown === 'persona' ? 'Persona' : breakdown === 'superMatch' ? 'Super' : 'Comercio'
	);

	const refLabel = $derived(formatYearMonth(dataStore.refMonth));

	/**
	 * The breakdown as a grid: the top 6 labels (by total) × the last 6 months.
	 * This is the single home for the per-label detail — no duplicate table.
	 */
	const breakdownGrid = $derived.by(() => {
		const topLabels = breakdownRows.slice(0, 6).map((row) => row.label);
		const cells: Record<string, number[]> = {};
		for (const label of topLabels) cells[label] = heatMonths.map(() => 0);

		for (const row of categoryRows) {
			if (!row.yearMonth) continue;
			const monthIndex = heatMonths.indexOf(row.yearMonth);
			if (monthIndex < 0) continue;
			const value =
				breakdown === 'persona'
					? row.personaLabel
					: breakdown === 'superMatch'
						? row.superMatch
						: row.comercio || 'Sin comercio';
			const label = value.trim() || 'Sin comercio';
			if (cells[label]) cells[label][monthIndex] += row.monto;
		}

		return topLabels.map((label) => ({ label, values: cells[label] }));
	});

	/** Tone for the budget pills: green ≤ 50%, amber ≤ 85%, red above. */
	function pctTone(pct: number | null): string {
		if (pct == null) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
		if (pct > 0.85) return 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400';
		if (pct > 0.5)
			return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
		return 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400';
	}

	/** Matching fill colour for the progress bar. */
	function barTone(pct: number | null): string {
		if (pct == null) return 'bg-gray-300 dark:bg-gray-700';
		if (pct > 0.85) return 'bg-red-500';
		if (pct > 0.5) return 'bg-amber-500';
		return 'bg-green-500';
	}
</script>

<section class="mx-auto max-w-7xl space-y-5">
	{#if dataStore.loading}
		<p class="text-sm text-gray-500">Cargando datos…</p>
	{/if}

	<!-- Everything lives in one card: months + breakdown side by side, bar below -->
	<Card>
		<div class="flex flex-wrap items-baseline justify-between gap-3">
			<div class="flex flex-wrap items-baseline gap-x-2">
				<span class="text-sm font-medium text-gray-500 dark:text-gray-400">
					{amountLabel} de {refLabel}
				</span>
				<span class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
					{formatCurrency(gastoMes)}
				</span>
			</div>
			<DeltaBadge delta={mom} size="md" />
		</div>

		<!-- Two columns: the month heatmap and the dimension heatmap, no repeats -->
		<div class="mt-4 grid gap-x-6 gap-y-6 md:grid-cols-2">
			<section class="min-w-0 space-y-2">
				<h3 class="text-xs font-medium uppercase tracking-wide text-gray-400">
					Últimos 6 meses
				</h3>
				{#if monthSeries.length === 0}
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Sin movimientos para esta categoría.
					</p>
				{:else}
					<Heatmap
						months={heatMonths}
						rows={[{ label: 'Gastado', values: monthSeries.map((p) => p.gasto) }]}
						format={formatThousands}
						labelHeader="Mes"
						highlight={dataStore.refMonth}
					/>
					<div class="grid grid-cols-3 gap-2">
						{#each monthSeries as point, i (point.yearMonth)}
							{@const prev = i > 0 ? monthSeries[i - 1] : null}
							<div
								class="flex flex-col items-center gap-1 rounded-lg border border-gray-100 px-2 py-1.5 dark:border-gray-800"
							>
								<span class="text-[11px] font-medium text-gray-500 dark:text-gray-400">
									{point.mes}
								</span>
								<DeltaBadge
									delta={momDelta(point.gasto, prev?.gasto ?? 0, prev != null)}
									label=""
								/>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<section class="min-w-0 space-y-2">
				<h3 class="text-xs font-medium uppercase tracking-wide text-gray-400">
					Desglose por {breakdownLabel.toLowerCase()}
				</h3>
				<Heatmap
					months={heatMonths}
					rows={breakdownGrid}
					format={formatThousands}
					labelHeader={breakdownLabel}
					highlight={dataStore.refMonth}
				/>
				{#if breakdownRows.length > breakdownGrid.length}
					<BreakdownTable data={breakdownRows} labelHeader={breakdownLabel} limit={0} />
				{/if}
			</section>
		</div>

		<!-- Budget progress, full width at the bottom -->
		<div class="mt-5 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
			<div class="flex items-baseline justify-between gap-3">
				<p class="flex flex-wrap items-baseline gap-x-1 text-sm text-gray-500 dark:text-gray-400">
					<span>Gastado</span>
					<span class="font-semibold text-gray-900 dark:text-gray-50">
						{formatThousands(gastoMes)}
					</span>
					{#if aporte > 0}
						<span class="font-normal text-gray-400 dark:text-gray-500">
							de {formatThousands(aporte)}
						</span>
					{/if}
				</p>
				<span
					class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold {pctTone(
						budgetPct
					)}"
				>
					{formatPct(budgetPct)}
				</span>
			</div>

			<div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
				<div
					class="h-full rounded-full {barTone(budgetPct)}"
					style="width: {Math.min(100, (budgetPct ?? 0) * 100)}%"
				></div>
			</div>

			{#if restante != null}
				<div class="flex items-center justify-between text-xs">
					<span class="font-medium text-gray-500 dark:text-gray-400">
						{restante >= 0 ? 'Presupuesto restante' : 'Excedido por'}
					</span>
					<span
						class="font-semibold {restante >= 0
							? 'text-gray-700 dark:text-gray-200'
							: 'text-red-600 dark:text-red-400'}"
					>
						{formatThousands(Math.abs(restante))} · {formatPct(restantePct)}
					</span>
				</div>
			{:else}
				<p class="text-xs text-gray-400 dark:text-gray-500">
					Configura tu aporte en <a class="underline" href="/settings">Configuración</a> para ver tu
					%.
				</p>
			{/if}
		</div>
	</Card>
</section>
