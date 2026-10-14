<script lang="ts">
	import { dataStore, planStore } from '$lib/stores/index.svelte';
	import { setPageTitle } from '$lib/ui/theme';
	import { seriesColors } from '$lib/ui/colors.svelte';
	import { weekTotalsForMonth } from '$lib/data/aggregates';
	import { APORTE_SCALE, CATEGORIES } from '$lib/config';
	import { formatThousands } from '$lib/format';
	import Card from '$lib/components/Card.svelte';
	import AllocationDoughnut from '$lib/components/AllocationDoughnut.svelte';
	import SpendRemainingChart from '$lib/components/SpendRemainingChart.svelte';
	import StackedMonthChart from '$lib/components/StackedMonthChart.svelte';
	import Heatmap from '$lib/components/Heatmap.svelte';

	setPageTitle('Inicio');

	/** Current-month spend per category (Ahorros excluded), missing ones read 0. */
	const categoryTotals = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const categoria of CATEGORIES) map[categoria] = 0;
		for (const row of dataStore.categoryMomSums) {
			if (row.categoria in map) map[row.categoria] = row.current;
		}
		return map;
	});

	const ingresoReal = $derived(planStore.ingreso * APORTE_SCALE);
	const ahorroReal = $derived(planStore.ahorroMensual * APORTE_SCALE);

	/** Largest envelope (max aporte, mil ₡) — the dashed reference on the weekly chart. */
	const maxAporteMil = $derived(Math.max(0, ...Object.values(planStore.aportes)));

	const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4'] as const;

	/** This month's spend per category, split into weeks W1–W4, biggest total first. */
	const weekPoints = $derived.by(() => {
		const byWeek = weekTotalsForMonth(dataStore.rows, dataStore.refMonth ?? '');
		return [...CATEGORIES]
			.map((categoria) => {
				const totals = Object.fromEntries(WEEK_LABELS.map((w) => [w, byWeek[categoria]?.[w] ?? 0]));
				const total = WEEK_LABELS.reduce((sum, w) => sum + totals[w], 0);
				return { mes: categoria, totals, total };
			})
			.sort((a, b) => b.total - a.total)
			.map(({ mes, totals }) => ({ mes, totals }));
	});

	/** Week series colours (one distinct palette slot per week). */
	const weekGroups = $derived.by(() => {
		const colors = seriesColors([...WEEK_LABELS]);
		return WEEK_LABELS.map((label, i) => ({ label, color: colors[i] }));
	});

	/** Categories × months grid for the heatmap (A–Z rows). */
	const heatmapRows = $derived(
		[...dataStore.monthGrid]
			.sort((a, b) => a.categoria.localeCompare(b.categoria, 'es'))
			.map((row) => ({ label: row.categoria, values: row.cells.map((cell) => cell.gasto) }))
	);
</script>

<svelte:head>
	<title>Inicio | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-7xl space-y-5">
	{#if dataStore.loading}
		<p class="text-sm text-accent-4">Cargando datos…</p>
	{:else if dataStore.error}
		<div
			class="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger"
		>
			<p class="font-semibold">Error al cargar los datos</p>
			<p class="text-sm">{dataStore.error}</p>
			<button
				type="button"
				onclick={() => dataStore.load()}
				class="mt-3 rounded-lg bg-accent-3 px-3 py-2 text-sm font-medium text-white hover:bg-accent-3/90"
			>
				Reintentar
			</button>
		</div>
	{/if}

	<!-- 2x2 grid: ingreso | semanal · sobres | delta -->
	<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
		<Card title="Ingreso-Mensual">
			<AllocationDoughnut totals={categoryTotals} ahorro={ahorroReal} ingreso={ingresoReal} />
		</Card>

		<!-- Current-month spend per category (biggest first), stacked by week W1-W4 -->
		<Card title="Semanal-Mensual">
			<StackedMonthChart
				points={weekPoints}
				groups={weekGroups}
				limitMil={maxAporteMil}
				horizontal
				minWidth={0}
			/>
		</Card>

		<!-- Budget consumed vs remaining per envelope, as a tornado -->
		<Card title="Sobres-Mensual">
			<SpendRemainingChart banks={dataStore.piggyBanks} />
		</Card>

		<!-- Spend per month, as a categories x months heatmap -->
		<Card title="Delta-Mensual">
			<Heatmap
				months={dataStore.availableMonths}
				rows={heatmapRows}
				format={formatThousands}
				labelHeader="Categoría"
				highlight={dataStore.refMonth}
				showTotalRow
				normalize="row"
			/>
		</Card>
	</div>

	{#if dataStore.fetchedAt}
		<p class="pt-2 text-center text-xs text-accent-4/70">
			{dataStore.cached ? 'Datos en caché' : 'Datos actualizados'} ·
			{dataStore.fetchedAt.toLocaleString('es-CR')}
		</p>
	{/if}
</section>
