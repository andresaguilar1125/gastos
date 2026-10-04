<script lang="ts">
	import { dataStore, budgetStore, DEFAULT_BUDGETS } from '$lib/stores/index.svelte';
	import { formatCurrency } from '$lib/budget/status';
	import PersonaBarChart from '$lib/components/charts/PersonaBarChart.svelte';

	const budget = $derived(budgetStore.budgets['Viajes'] ?? DEFAULT_BUDGETS['Viajes']);
	const totalViajes = $derived(dataStore.personaSums.reduce((a, b) => a + b.sum, 0));
</script>

<svelte:head>
	<title>Viajes | Finanzas CRC</title>
</svelte:head>

<section class="mx-auto max-w-7xl space-y-6">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Viajes</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">Gastos de viaje por persona (Andres, Mari, Trabajo).</p>
	</header>

	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Viajes</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(totalViajes)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Máx. presupuesto</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(budget.max)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Restante</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(Math.max(0, budget.max - totalViajes))}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">% usado</p>
			<p class="mt-1 text-xl font-bold">{budget.max ? Math.round((totalViajes / budget.max) * 100) : 0}%</p>
		</div>
	</div>

	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<h2 class="mb-3 text-lg font-semibold">Gastos por persona</h2>
		<div class="h-[28rem]">
			<PersonaBarChart data={dataStore.personaSums} />
		</div>
	</div>
</section>
