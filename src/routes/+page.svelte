<script lang="ts">
	import { dataStore } from '$lib/stores/index.svelte';
	import { budgetStore } from '$lib/stores/index.svelte';
	import { formatCurrency, evaluateSpend } from '$lib/budget/status';
	import { CATEGORY_COLORS, DEFAULT_BUDGETS } from '$lib/config';
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryDonut from '$lib/components/charts/CategoryDonut.svelte';
	import CategoryBudgetBar from '$lib/components/charts/CategoryBudgetBar.svelte';
	import AhorroChart from '$lib/components/charts/AhorroChart.svelte';

	setPageTitle('Dashboard');

	let totalMin = $derived(
		Object.values(budgetStore.budgets).reduce((sum, b) => sum + b.min, 0)
	);
	let totalMax = $derived(
		Object.values(budgetStore.budgets).reduce((sum, b) => sum + b.max, 0)
	);
	let inRangeCount = $derived(
		dataStore.categorySums.filter((a) => {
			const budget = budgetStore.budgets[a.categoria] ?? DEFAULT_BUDGETS[a.categoria as keyof typeof DEFAULT_BUDGETS];
			return budget ? evaluateSpend(a.sum, budget).inRange : false;
		}).length
	);
</script>

<svelte:head>
	<title>Dashboard | Finanzas CRC</title>
</svelte:head>

<section class="mx-auto max-w-7xl space-y-6">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			{dataStore.cached ? 'Datos en caché' : 'Datos actualizados'}
			{#if dataStore.fetchedAt}
				· {dataStore.fetchedAt.toLocaleString('es-CR')}
			{/if}
		</p>
	</header>

	{#if dataStore.loading}
		<p class="text-sm text-gray-500">Cargando datos…</p>
	{:else if dataStore.error}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
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

	<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total gastado</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(dataStore.total)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Mín. presupuesto</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(totalMin)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Máx. presupuesto</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(totalMax)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Restante</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(Math.max(0, totalMax - dataStore.total))}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">% usado</p>
			<p class="mt-1 text-xl font-bold">
				{totalMax ? Math.round((dataStore.total / totalMax) * 100) : 0}%
			</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Categorías en rango</p>
			<p class="mt-1 text-xl font-bold">{inRangeCount} / {dataStore.categorySums.length}</p>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
			<h2 class="mb-3 text-lg font-semibold">Distribución por categoría</h2>
			<div class="h-80">
				<CategoryDonut data={dataStore.categorySums} />
			</div>
		</div>

		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<h2 class="mb-3 text-lg font-semibold">Ahorro acumulado</h2>
			<div class="h-80">
				<AhorroChart rows={dataStore.rows} />
			</div>
		</div>
	</div>

	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<h2 class="mb-3 text-lg font-semibold">Gasto vs presupuesto</h2>
		<div class="h-96">
			<CategoryBudgetBar data={dataStore.categorySums} budgets={budgetStore.budgets} />
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each dataStore.categorySums as agg (agg.categoria)}
			{@const budget = budgetStore.budgets[agg.categoria] ?? DEFAULT_BUDGETS[agg.categoria as keyof typeof DEFAULT_BUDGETS]}
			{@const status = budget ? evaluateSpend(agg.sum, budget) : null}
			<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<div class="flex items-center gap-2">
					<span
						class="inline-block h-3 w-3 rounded-full"
						style="background-color: {CATEGORY_COLORS[agg.categoria as keyof typeof CATEGORY_COLORS] ?? '#888'}"
					></span>
					<h3 class="font-semibold">{agg.categoria}</h3>
				</div>
				<p class="mt-1 text-2xl font-bold">{formatCurrency(agg.sum)}</p>
				<p class="text-xs text-gray-500 dark:text-gray-400">{agg.pct}% del total</p>
				{#if status}
					<span
						class="mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium"
						style="background-color: {status.color}20; color: {status.color}"
					>
						{status.label}
					</span>
				{/if}
			</div>
		{/each}
	</div>
</section>
