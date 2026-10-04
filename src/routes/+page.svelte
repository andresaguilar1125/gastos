<script lang="ts">
	import { dataStore, budgetStore } from '$lib/stores/index.svelte';
	import { formatCurrency, evaluateSpend } from '$lib/budget/status';
	import { CATEGORY_COLORS, DEFAULT_BUDGETS } from '$lib/config';
	import { setPageTitle } from '$lib/ui/theme';
	import Card from '$lib/components/Card.svelte';
	import DeltaBadge from '$lib/components/DeltaBadge.svelte';
	import CategoryDonut from '$lib/components/charts/CategoryDonut.svelte';
	import CategoryBudgetBar from '$lib/components/charts/CategoryBudgetBar.svelte';
	import MonthBarChart from '$lib/components/charts/MonthBarChart.svelte';

	setPageTitle('Dashboard');

	const MONTH_ES: Record<string, string> = {
		Jan: 'Enero', Feb: 'Febrero', Mar: 'Marzo', Apr: 'Abril', May: 'Mayo', Jun: 'Junio',
		Jul: 'Julio', Aug: 'Agosto', Sep: 'Septiembre', Oct: 'Octubre', Nov: 'Noviembre', Dec: 'Diciembre'
	};

	let totalMin = $derived(
		Object.values(budgetStore.budgets).reduce((sum, b) => sum + b.min, 0)
	);
	let totalMax = $derived(
		Object.values(budgetStore.budgets).reduce((sum, b) => sum + b.max, 0)
	);
	let inRangeCount = $derived(
		dataStore.categorySums.filter((a) => {
			const budget =
				budgetStore.budgets[a.categoria] ??
				DEFAULT_BUDGETS[a.categoria as keyof typeof DEFAULT_BUDGETS];
			return budget ? evaluateSpend(a.sum, budget).inRange : false;
		}).length
	);

	let currentLabel = $derived(
		dataStore.latestMonth ? (MONTH_ES[dataStore.latestMonth] ?? dataStore.latestMonth) : '—'
	);
	let previousLabel = $derived(
		dataStore.previousMonth
			? (MONTH_ES[dataStore.previousMonth] ?? dataStore.previousMonth)
			: null
	);
	let maxCategorySum = $derived(
		Math.max(1, ...dataStore.categorySums.map((c) => c.sum))
	);
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

	<!-- Headline: this month vs last month -->
	<div class="grid gap-5 lg:grid-cols-3">
		<Card class="lg:col-span-2">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
						Gasto de {currentLabel}
					</p>
					<p class="mt-1 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
						{formatCurrency(dataStore.latestMonthSum)}
					</p>
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<DeltaBadge delta={dataStore.momTotal} size="md" />
						{#if previousLabel}
							<span class="text-xs text-gray-500 dark:text-gray-400">
								{previousLabel}: {formatCurrency(dataStore.previousMonthSum)}
							</span>
						{/if}
					</div>
				</div>
				<div class="text-right">
					<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total histórico</p>
					<p class="text-lg font-semibold text-gray-700 dark:text-gray-200">
						{formatCurrency(dataStore.total)}
					</p>
				</div>
			</div>

			<div class="mt-4 h-64 overscroll-contain">
				<MonthBarChart data={dataStore.monthSums} highlight={dataStore.latestMonth} />
			</div>
		</Card>

		<Card title="Estadísticas de este mes" subtitle="Comparado con el mes anterior">
			<ul class="space-y-3">
				{#each dataStore.categoryMomSums as row (row.categoria)}
					<li class="flex items-center gap-3">
						<span
							class="h-9 w-1.5 shrink-0 rounded-full"
							style="background-color: {CATEGORY_COLORS[
								row.categoria as keyof typeof CATEGORY_COLORS
							] ?? '#94a3b8'}"
						></span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
								{row.categoria}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{formatCurrency(row.current)}
							</p>
						</div>
						<DeltaBadge delta={row.delta} label="" />
					</li>
				{/each}
				{#if dataStore.categoryMomSums.length === 0}
					<li class="text-sm text-gray-500">Sin datos para este mes.</li>
				{/if}
			</ul>
		</Card>
	</div>

	<!-- KPI strip -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<Card class="!px-4">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Mín. presupuesto</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(totalMin)}</p>
		</Card>
		<Card class="!px-4">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Máx. presupuesto</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(totalMax)}</p>
		</Card>
		<Card class="!px-4">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">% usado</p>
			<p class="mt-1 text-xl font-bold">
				{totalMax ? Math.round((dataStore.total / totalMax) * 100) : 0}%
			</p>
		</Card>
		<Card class="!px-4">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Categorías en rango</p>
			<p class="mt-1 text-xl font-bold">{inRangeCount} / {dataStore.categorySums.length}</p>
		</Card>
	</div>

	<!-- Category shares + top categories -->
	<div class="grid gap-5 lg:grid-cols-3">
		<Card title="Distribución por categoría" class="lg:col-span-2">
			<div class="h-72 overscroll-contain">
				<CategoryDonut data={dataStore.categorySums} />
			</div>
		</Card>

		<Card title="Top categorías" subtitle="Mes actual">
			<ul class="space-y-4">
				{#each dataStore.categoryMomSums.slice(0, 5) as row (row.categoria)}
					<li>
						<div class="flex items-center justify-between gap-3 text-sm">
							<span class="font-medium text-gray-900 dark:text-gray-100">{row.categoria}</span>
							<span class="font-semibold text-gray-700 dark:text-gray-200">
								{formatCurrency(row.current)}
							</span>
						</div>
						<div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
							<div
								class="h-full rounded-full bg-primary"
								style="width: {Math.round((row.current / maxCategorySum) * 100)}%"
							></div>
						</div>
					</li>
				{/each}
			</ul>
		</Card>
	</div>

	<!-- Budget vs spend -->
	<Card title="Gasto vs presupuesto" subtitle="Todo el histórico">
		<div class="h-96 overscroll-contain">
			<CategoryBudgetBar data={dataStore.categorySums} budgets={budgetStore.budgets} />
		</div>
	</Card>

	<!-- Category mini-cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each dataStore.categorySums as agg (agg.categoria)}
			{@const budget =
				budgetStore.budgets[agg.categoria] ??
				DEFAULT_BUDGETS[agg.categoria as keyof typeof DEFAULT_BUDGETS]}
			{@const status = budget ? evaluateSpend(agg.sum, budget) : null}
			<Card class="!px-4 !py-3">
				<div class="flex items-center gap-2">
					<span
						class="inline-block h-3 w-3 rounded-full"
						style="background-color: {CATEGORY_COLORS[
							agg.categoria as keyof typeof CATEGORY_COLORS
						] ?? '#888'}"
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
			</Card>
		{/each}
	</div>

	<!-- Moved from the header: data freshness, centered at the bottom -->
	{#if dataStore.fetchedAt}
		<p class="pt-2 text-center text-xs text-gray-400 dark:text-gray-500">
			{dataStore.cached ? 'Datos en caché' : 'Datos actualizados'} ·
			{dataStore.fetchedAt.toLocaleString('es-CR')}
		</p>
	{/if}
</section>
