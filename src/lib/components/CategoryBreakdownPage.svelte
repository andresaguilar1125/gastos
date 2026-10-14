<script lang="ts">
	import { dataStore, planStore } from '$lib/stores/index.svelte';
	import { labelColor, normalizeLabel } from '$lib/ui/colors.svelte';
	import { breakdownMonthSeries, breakdownStats } from '$lib/budget/breakdown';
	import type { BreakdownDimension } from '$lib/budget/breakdown';
	import { groupPurchaseRows } from '$lib/data/group';
	import type { CompareGroup, CompareSpec, NormalizedRow } from '$lib/types';
	import Card from '$lib/components/Card.svelte';
	import StackedMonthChart from '$lib/components/StackedMonthChart.svelte';
	import CompareMonthChart from '$lib/components/CompareMonthChart.svelte';
	import CategoryStatsTable from '$lib/components/CategoryStatsTable.svelte';
	import LedgerHistoryTable from '$lib/components/LedgerHistoryTable.svelte';

	interface Props {
		/** Category this page reports on, e.g. "Comida" or "Super". */
		categoria: string;
		/** Column the stats table and history group by. */
		dimension?: BreakdownDimension;
		/** Column the chart groups by; defaults to `dimension` (Super uses weeks). */
		chartDimension?: BreakdownDimension;
		/** Header for the grouping column, e.g. "Persona" or "Comercio". */
		labelHeader?: string;
		/** Title of the main monthly chart, e.g. "Delta-Comida". */
		deltaTitle?: string;
		/** Title of the comparison chart; defaults to the spec title. */
		compareTitle?: string;
		/** Shown when there are no rows. */
		emptyLabel?: string;
		/** Show the "Categoría por producto" stats table (Super only). */
		showStats?: boolean;
		/** Title of the optional stats card. */
		statsTitle?: string;
		/** Header for the stats count column. */
		countHeader?: string;
		/** Title of the history card, e.g. "Data-Comida". */
		dataTitle?: string;
		/** Optional mirrored comparison chart (chart only), e.g. Salidas vs Express. */
		compare?: CompareSpec;
		/** Draw both charts with horizontal bars (months down the y-axis). */
		horizontal?: boolean;
		/**
		 * Show a toggle on the history card that collapses detailed purchase
		 * lines sharing a datetime into one `Compra Total` row (Super only).
		 */
		groupHistory?: boolean;
	}

	let {
		categoria,
		dimension = 'persona',
		chartDimension = undefined,
		labelHeader = 'Persona',
		deltaTitle = 'Delta',
		compareTitle = undefined,
		emptyLabel = 'Sin compras registradas.',
		showStats = false,
		statsTitle = 'Categoría por producto',
		countHeader = 'Compras',
		dataTitle = 'Data',
		compare = undefined,
		horizontal = false,
		groupHistory = false
	}: Props = $props();

	/** History grouping trigger; defaults to on (Super only). */
	let historyGrouped = $state(true);

	/** Minimum canvas width so the bars stay legible; the chart scrolls below it. */
	const CHART_MIN_WIDTH = 560;

	/** The chart series (weeks on Super) — one series per label, per month. */
	const series = $derived(
		breakdownMonthSeries(dataStore.rows, categoria, chartDimension ?? dimension, dataStore.refMonth)
	);
	const points = $derived(series.points);
	const chartGroups = $derived(series.groups);

	/** Grid columns follow the number of cards actually rendered (2 or 3). */
	const gridCols = $derived(
		compare && showStats
			? 'sm:grid-cols-2 lg:grid-cols-3'
			: showStats || compare
				? 'sm:grid-cols-2'
				: ''
	);

	/** Display label of a comparison side (plain label or named group). */
	function groupLabel(group: CompareGroup): string {
		return typeof group === 'string' ? group : group.label;
	}

	/**
	 * Accent colour of a comparison side, taken from the main chart's own series
	 * so the tornado always matches it (and reacts to the Colores settings). Falls
	 * back to the per-label accent when the side has no series of its own.
	 */
	function groupColor(group: CompareGroup): string {
		const label = groupLabel(group);
		return (
			chartGroups.find((g) => normalizeLabel(g.label) === normalizeLabel(label))?.color ??
			labelColor(label)
		);
	}

	/** The two tornado side colours, recomputed when the palette accents change. */
	const compareColors = $derived.by(() =>
		compare
			? { positive: groupColor(compare.positive), negative: groupColor(compare.negative) }
			: null
	);

	/** Red reference line: the category's monthly aporte (thousands). 0 hides it. */
	const limitMil = $derived(planStore.aportes[categoria] ?? 0);

	/** Every row of this category in the (already month-filtered) dataset. */
	const categoryRows = $derived(
		dataStore.rows.filter((row) => row.categoria.toLowerCase() === categoria.toLowerCase())
	);

	/** History rows: optionally collapsed into one `Compra Total` per datetime. */
	const historyRows = $derived(
		groupHistory && historyGrouped ? groupPurchaseRows(categoryRows) : categoryRows
	);

	/** Purchase counts/averages per label, only when the stats table is shown. */
	const stats = $derived(showStats ? breakdownStats(dataStore.rows, categoria, dimension) : []);

	/** Grouping value for the history table, per dimension. */
	function labelValue(row: NormalizedRow): string {
		return dimension === 'comercio' ? row.comercio : row.personaLabel;
	}
</script>

<section class="mx-auto max-w-7xl space-y-5">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight text-accent-5">{categoria}</h1>
	</header>

	{#if dataStore.loading}
		<p class="text-sm text-accent-4">Cargando datos…</p>
	{/if}

	<!-- Responsive grid: main chart | comparison chart | stats table -->
	<div class="grid grid-cols-1 gap-5 {gridCols}">
		<!-- Stacked bars per month, one series per label, with the aporte line -->
		<Card>
			{#snippet header()}
				<h2 class="text-base font-semibold text-accent-5">{deltaTitle}</h2>
			{/snippet}

			<StackedMonthChart
				{points}
				groups={chartGroups}
				{limitMil}
				{horizontal}
				minWidth={horizontal ? 0 : CHART_MIN_WIDTH}
				{emptyLabel}
			/>
		</Card>

		<!-- Mirrored comparison chart (e.g. Salidas vs Express) -->
		{#if compare}
			<Card>
				{#snippet header()}
					<h2 class="text-base font-semibold text-accent-5">
						{compareTitle ??
							compare.title ??
							`${groupLabel(compare.positive)} vs ${groupLabel(compare.negative)}`}
					</h2>
				{/snippet}

				<CompareMonthChart
					points={series.points}
					positive={compare.positive}
					negative={compare.negative}
					positiveColor={compareColors?.positive}
					negativeColor={compareColors?.negative}
					{horizontal}
					minWidth={horizontal ? 0 : CHART_MIN_WIDTH}
					{emptyLabel}
				/>
			</Card>
		{/if}

		<!-- Purchase counts + averages per label -->
		{#if showStats}
			<Card title={statsTitle}>
				<CategoryStatsTable {stats} {labelHeader} {countHeader} {emptyLabel} />
			</Card>
		{/if}
	</div>

	<!-- Every row of this category, newest first, grouped by month -->
	<Card stickyHeader>
		{#snippet header()}
			<div class="flex w-full flex-wrap items-center justify-between gap-3">
				<h2 class="text-base font-semibold text-accent-5">
					{dataTitle}
				</h2>
				{#if groupHistory}
					<button
						type="button"
						role="switch"
						aria-checked={historyGrouped}
						onclick={() => (historyGrouped = !historyGrouped)}
						class="group inline-flex items-center gap-2 rounded-full border border-accent-4/20 bg-white/60 py-0.5 pl-2.5 pr-2 text-xs font-medium text-accent-4 transition-colors hover:border-accent-4/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-3 focus-visible:ring-offset-2"
					>
						Agrupar compras
						<span
							class="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 {historyGrouped
								? 'bg-accent-3'
								: 'bg-accent-4/25 '}"
							aria-hidden="true"
						>
							<span
								class="inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 {historyGrouped
									? 'translate-x-3.5'
									: 'translate-x-0.5'}"
							></span>
						</span>
					</button>
				{/if}
			</div>
		{/snippet}

		<LedgerHistoryTable
			rows={historyRows}
			{labelHeader}
			{labelValue}
			{emptyLabel}
			refMonth={dataStore.refMonth}
		/>
	</Card>
</section>
