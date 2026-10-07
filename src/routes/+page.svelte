<script lang="ts">
	import { dataStore, planStore } from '$lib/stores/index.svelte';
	import { formatCurrency } from '$lib/format';
	import { setPageTitle } from '$lib/ui/theme';
	import { formatYearMonth } from '$lib/data/aggregates';
	import Card from '$lib/components/Card.svelte';
	import DeltaBadge from '$lib/components/DeltaBadge.svelte';
	import PiggyBankTable from '$lib/components/PiggyBankTable.svelte';
	import MonthGrid from '$lib/components/MonthGrid.svelte';
	import BreakdownTable from '$lib/components/BreakdownTable.svelte';

	setPageTitle('Dashboard');

	const refLabel = $derived(formatYearMonth(dataStore.refMonth));
	const prevLabel = $derived(formatYearMonth(dataStore.previousMonth));

	/** Spend this month, excluding Ahorros (savings are not spend). */
	const spendByCategory = $derived(
		dataStore.categoryMomSums
			.filter((row) => row.categoria !== 'Ahorros')
			.sort((a, b) => b.current - a.current)
	);
	const topSpend = $derived(spendByCategory.map((row) => ({ label: row.categoria, sum: row.current })));
</script>

<svelte:head>
	<title>Dashboard | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-7xl space-y-5">
	{#if dataStore.loading}
		<p class="text-sm text-gray-500">Cargando datos…</p>
	{:else if dataStore.error}
		<div
			class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
		>
			<p class="font-semibold">Error al cargar los datos</p>
			<p class="text-sm">{dataStore.error}</p>
			<button
				type="button"
				onclick={() => dataStore.load()}
				class="mt-3 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
			>
				Reintentar
			</button>
		</div>
	{/if}

	<!-- Headline: this month vs last month (spending only) -->
	<div class="grid gap-5 lg:grid-cols-3">
		<Card class="lg:col-span-2">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
						Gasto de {refLabel}
					</p>
					<p class="mt-1 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
						{formatCurrency(dataStore.refMonthSum)}
					</p>
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<DeltaBadge delta={dataStore.momTotal} size="md" />
						{#if dataStore.previousMonth}
							<span class="text-xs text-gray-500 dark:text-gray-400">
								{prevLabel}: {formatCurrency(dataStore.previousMonthSum)}
							</span>
						{/if}
					</div>
				</div>
				<div class="text-right">
					<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total histórico</p>
					<p class="text-lg font-semibold text-gray-700 dark:text-gray-200">
						{formatCurrency(dataStore.total)}
					</p>
					<p class="mt-1 text-[11px] text-gray-400">sin Ahorros</p>
				</div>
			</div>
		</Card>

		<Card title="Gasto de este mes" subtitle="Por categoría (sin Ahorros)">
			<BreakdownTable data={topSpend} labelHeader="Categoría" limit={6} />
		</Card>
	</div>

	<!-- The single table shape: every category is a piggy bank -->
	<Card
		title="Alcancías"
		subtitle="Aporte mensual, gasto del mes, % del presupuesto y saldo arrastrado · {refLabel}"
	>
		<PiggyBankTable banks={dataStore.piggyBanks} />
		{#if Object.values(planStore.aportes).every((v) => v === 0)}
			<p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
				Los aportes están en 0. Configúralos en <a class="underline" href="/settings">Configuración</a>
				para ver saldos y tu % del presupuesto.
			</p>
		{/if}
	</Card>

	<!-- Categories × months: the month-over-month signal -->
	<Card
		title="Gasto por mes"
		subtitle="Celda roja = el gasto del mes supera el aporte"
	>
		{#if dataStore.availableMonths.length}
			<MonthGrid rows={dataStore.monthGrid} months={dataStore.availableMonths} />
		{:else}
			<p class="text-sm text-gray-500 dark:text-gray-400">Sin datos para el periodo.</p>
		{/if}
	</Card>

	{#if dataStore.fetchedAt}
		<p class="pt-2 text-center text-xs text-gray-400 dark:text-gray-500">
			{dataStore.cached ? 'Datos en caché' : 'Datos actualizados'} ·
			{dataStore.fetchedAt.toLocaleString('es-CR')}
		</p>
	{/if}
</section>
