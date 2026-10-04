<script lang="ts">
	import { dataStore, budgetStore, DEFAULT_BUDGETS } from '$lib/stores/index.svelte';
	import { formatCurrency, evaluateSpend } from '$lib/budget/status';
	import { BUDGET_SCALE } from '$lib/config';
	import NotaBarChart from '$lib/components/charts/NotaBarChart.svelte';

	const budget = $derived(budgetStore.budgets['Recibos'] ?? DEFAULT_BUDGETS['Recibos']);
	const budgetMaxReal = $derived(budget.cap * BUDGET_SCALE);
	const totalRecibos = $derived(
		dataStore.categoryMomSums.find((c) => c.categoria === 'Recibos')?.current ?? 0
	);
	const untouched = $derived(
		dataStore.notaSums.filter((n) => n.sum === 0).map((n) => n.nota)
	);
	const status = $derived(evaluateSpend(totalRecibos, budget));
</script>

<svelte:head>
	<title>Recibos | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-7xl space-y-6">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Recibos</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">Desglose por nota/sobre. El objetivo es agotar el presupuesto.</p>
	</header>

	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Recibos</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(totalRecibos)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Tope</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(budgetMaxReal)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Restante</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(Math.max(0, budgetMaxReal - totalRecibos))}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Estado</p>
			<p class="mt-1 text-xl font-bold" style="color: {status.color}">{status.label}</p>
		</div>
	</div>

	{#if untouched.length > 0}
		<div class="rounded-lg border border-warning/30 bg-warning/10 p-4 dark:bg-warning/5">
			<p class="font-semibold text-warning-dark">Sin gastar este periodo</p>
			<p class="text-sm">{untouched.join(', ')}</p>
		</div>
	{/if}

	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<h2 class="mb-3 text-lg font-semibold">Desglose por nota</h2>
		<div class="h-[28rem]">
			<NotaBarChart data={dataStore.notaSums} maxBudget={budgetMaxReal} />
		</div>
	</div>
</section>
