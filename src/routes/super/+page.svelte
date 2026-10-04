<script lang="ts">
	import { dataStore, budgetStore, DEFAULT_BUDGETS } from '$lib/stores/index.svelte';
	import { formatCurrency } from '$lib/budget/status';
	import GrupoBarChart from '$lib/components/charts/GrupoBarChart.svelte';

	const budget = $derived(budgetStore.budgets['Super'] ?? DEFAULT_BUDGETS['Super']);
	const totalSuper = $derived(dataStore.grupoSums.reduce((a, b) => a + b.sum, 0));
</script>

<svelte:head>
	<title>Super | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-7xl space-y-6">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Super</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">Gastos agrupados por categoría de supermercado.</p>
	</header>

	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Super</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(totalSuper)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Máx. presupuesto</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(budget.max)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Restante</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(Math.max(0, budget.max - totalSuper))}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">% usado</p>
			<p class="mt-1 text-xl font-bold">{budget.max ? Math.round((totalSuper / budget.max) * 100) : 0}%</p>
		</div>
	</div>

	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<h2 class="mb-3 text-lg font-semibold">Gastos por grupo</h2>
		<div class="h-[28rem]">
			<GrupoBarChart data={dataStore.grupoSums} />
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each dataStore.grupoSums.slice(0, 3) as grupo, i (grupo.grupo)}
			<div class="rounded-xl border border-warning/30 bg-warning/10 p-4 dark:bg-warning/5">
				<p class="text-xs font-medium text-warning-dark">Top {i + 1}</p>
				<p class="text-lg font-semibold">{grupo.grupo}</p>
				<p class="text-2xl font-bold">{formatCurrency(grupo.sum)}</p>
			</div>
		{/each}
	</div>
</section>
