<script lang="ts">
	import { dataStore, budgetStore, DEFAULT_BUDGETS } from '$lib/stores/index.svelte';
	import { formatCurrency, evaluateSpend } from '$lib/budget/status';
	import { CATEGORY_COLORS } from '$lib/config';
	import Card from '$lib/components/Card.svelte';
	import DeltaBadge from '$lib/components/DeltaBadge.svelte';
	import NotaBarChart from '$lib/components/charts/NotaBarChart.svelte';
	import MonthBarChart from '$lib/components/charts/MonthBarChart.svelte';
	import type { NormalizedRow, NotaAggregate } from '$lib/types';

	interface Props {
		categoria: string;
		descripcion: string;
	}

	let { categoria, descripcion }: Props = $props();

	const MONTH_ES: Record<string, string> = {
		Jan: 'Enero',
		Feb: 'Febrero',
		Mar: 'Marzo',
		Apr: 'Abril',
		May: 'Mayo',
		Jun: 'Junio',
		Jul: 'Julio',
		Aug: 'Agosto',
		Sep: 'Septiembre',
		Oct: 'Octubre',
		Nov: 'Noviembre',
		Dec: 'Diciembre'
	};

	const budget = $derived(
		budgetStore.budgets[categoria] ?? DEFAULT_BUDGETS[categoria as keyof typeof DEFAULT_BUDGETS]
	);
	const color = $derived(
		CATEGORY_COLORS[categoria as keyof typeof CATEGORY_COLORS] ?? '#f97316'
	);

	/** Rows for this category only. */
	const categoryRows = $derived(
		dataStore.rows.filter((r) => r.categoria.toLowerCase() === categoria.toLowerCase())
	);
	const total = $derived(categoryRows.reduce((sum, r) => sum + r.monto, 0));

	/** Monthly totals filtered to this category. */
	const monthSums = $derived.by(() => {
		const totals: Record<string, { sum: number; index: number }> = {};
		for (const row of categoryRows) {
			const key = row.mes?.trim().slice(0, 3);
			if (!key) continue;
			totals[key] = totals[key] ?? { sum: 0, index: 0 };
			totals[key].sum += row.monto;
		}
		const order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return Object.entries(totals)
			.map(([mes, v]) => ({ mes, sum: v.sum, index: order.indexOf(mes) }))
			.filter((m) => m.index >= 0)
			.sort((a, b) => a.index - b.index);
	});

	const mom = $derived.by(() => {
		if (monthSums.length === 0)
			return { delta: 0, pct: 0, direction: 'flat' as const, hasPrevious: false };
		// Respect the shared "current month" (including the dev override).
		const currentMes = dataStore.latestMonth ?? monthSums[monthSums.length - 1].mes;
		const idx = monthSums.findIndex((m) => m.mes === currentMes);
		const current = idx >= 0 ? monthSums[idx] : monthSums[monthSums.length - 1];
		const previous = idx > 0 ? monthSums[idx - 1] : null;
		const prevSum = previous?.sum ?? 0;
		const delta = current.sum - prevSum;
		const pct = previous && prevSum > 0 ? Math.round((delta / prevSum) * 100) : 0;
		return {
			delta,
			pct,
			direction: delta > 0 ? ('up' as const) : delta < 0 ? ('down' as const) : ('flat' as const),
			hasPrevious: previous != null
		};
	});

	/** The month currently displayed, honoring the shared "current month". */
	const currentMonth = $derived(
		dataStore.latestMonth ?? (monthSums.length ? monthSums[monthSums.length - 1].mes : null)
	);
	const currentMonthSum = $derived(
		currentMonth ? (monthSums.find((m) => m.mes === currentMonth)?.sum ?? 0) : 0
	);
	const latestLabel = $derived(
		currentMonth ? (MONTH_ES[currentMonth] ?? currentMonth) : '—'
	);

	/** Breakdown by the sheet's Nota value (top 12). */
	const notaSums = $derived.by<NotaAggregate[]>(() => {
		const totals: Record<string, number> = {};
		for (const row of categoryRows) {
			const nota = (row.nota || row.descripcion || 'Sin nota').trim();
			if (!nota) continue;
			totals[nota] = (totals[nota] ?? 0) + row.monto;
		}
		return Object.entries(totals)
			.map(([nota, sum]) => ({ nota, sobre: categoria, sum }))
			.sort((a, b) => b.sum - a.sum)
			.slice(0, 12);
	});

	const status = $derived(budget ? evaluateSpend(total, budget) : null);
	const topComercio = $derived.by(() => {
		const totals: Record<string, number> = {};
		for (const row of categoryRows) {
			const c = row.comercio || 'Sin comercio';
			totals[c] = (totals[c] ?? 0) + row.monto;
		}
		return Object.entries(totals)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	});
</script>

<section class="mx-auto max-w-7xl space-y-5">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight" style="color: {color}">{categoria}</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">{descripcion}</p>
	</header>

	{#if dataStore.loading}
		<p class="text-sm text-gray-500">Cargando datos…</p>
	{/if}

	<div class="grid gap-5 lg:grid-cols-3">
		<Card class="lg:col-span-2">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
						Gasto de {latestLabel}
					</p>
					<p class="mt-1 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
						{formatCurrency(currentMonthSum)}
					</p>
					<div class="mt-2">
						<DeltaBadge delta={mom} size="md" />
					</div>
				</div>
				<div class="text-right">
					<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total histórico</p>
					<p class="text-lg font-semibold text-gray-700 dark:text-gray-200">
						{formatCurrency(total)}
					</p>
				</div>
			</div>
			<div class="mt-4 h-64 overscroll-contain">
				<MonthBarChart data={monthSums} highlight={currentMonth} />
			</div>
		</Card>

		<Card title="Resumen">
			<dl class="space-y-3 text-sm">
				<div class="flex items-center justify-between">
					<dt class="text-gray-500 dark:text-gray-400">Presupuesto</dt>
					<dd class="font-semibold">
						{formatCurrency(budget?.min ?? 0)} – {formatCurrency(budget?.max ?? 0)}
					</dd>
				</div>
				<div class="flex items-center justify-between">
					<dt class="text-gray-500 dark:text-gray-400">Restante</dt>
					<dd class="font-semibold">
						{formatCurrency(Math.max(0, (budget?.max ?? 0) - total))}
					</dd>
				</div>
				{#if status}
					<div class="flex items-center justify-between">
						<dt class="text-gray-500 dark:text-gray-400">Estado</dt>
						<dd>
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium"
								style="background-color: {status.color}20; color: {status.color}"
							>
								{status.label}
							</span>
						</dd>
					</div>
				{/if}
				<div class="flex items-center justify-between">
					<dt class="text-gray-500 dark:text-gray-400">Movimientos</dt>
					<dd class="font-semibold">{categoryRows.length}</dd>
				</div>
			</dl>

			{#if topComercio.length}
				<h3 class="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">
					Top comercios
				</h3>
				<ul class="mt-2 space-y-1.5 text-sm">
					{#each topComercio as [nombre, suma] (nombre)}
						<li class="flex items-center justify-between gap-2">
							<span class="truncate text-gray-600 dark:text-gray-300">{nombre}</span>
							<span class="font-medium">{formatCurrency(suma)}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</div>

	<Card title="Desglose por nota" subtitle="Valores del catálogo de la hoja (top 12)">
		{#if notaSums.length}
			<div class="h-[26rem] overscroll-contain">
				<NotaBarChart data={notaSums} maxBudget={budget?.max} />
			</div>
		{:else}
			<p class="text-sm text-gray-500">Sin movimientos para esta categoría.</p>
		{/if}
	</Card>
</section>
