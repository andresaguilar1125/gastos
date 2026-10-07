<script lang="ts">
	import { onMount } from 'svelte';
	import { dataStore, planStore } from '$lib/stores/index.svelte';
	import { formatCurrency, formatPct, formatThousands } from '$lib/format';
	import { formatYearMonth } from '$lib/data/aggregates';
	import { setPageTitle } from '$lib/ui/theme';
	import { CAR_GOAL_DEFAULT, VIAJES_GROUPS, VIAJES_LIMIT_DEFAULT } from '$lib/config';
	import { carGoalMonths, linearTrend, tripStats, viajesMonthSeries } from '$lib/budget/viajes';
	import Card from '$lib/components/Card.svelte';
	import EChart from '$lib/components/EChart.svelte';
	import RangeToggle from '$lib/components/RangeToggle.svelte';
	import TripStatsTable from '$lib/components/TripStatsTable.svelte';

	setPageTitle('Viajes');

	const GOAL_KEY = 'finanzas-viajes-goal';

	/** Visible window in months: 1 = CM, 3, 6, or 0 = ALL. */
	let range = $state(6);
	/** Monthly limit drawn as a reference line, in thousands of colones. */
	let limitMil = $state(VIAJES_LIMIT_DEFAULT);
	/** Electric-car goal, in thousands of colones. */
	let goalTargetMil = $state(CAR_GOAL_DEFAULT.targetMil);
	let goalSavingMil = $state(CAR_GOAL_DEFAULT.savingMil);

	onMount(() => {
		try {
			const raw = localStorage.getItem(GOAL_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<{
				limitMil: number;
				targetMil: number;
				savingMil: number;
			}>;
			if (typeof parsed.limitMil === 'number') limitMil = parsed.limitMil;
			if (typeof parsed.targetMil === 'number') goalTargetMil = parsed.targetMil;
			if (typeof parsed.savingMil === 'number') goalSavingMil = parsed.savingMil;
		} catch {
			/* ignore malformed storage */
		}
	});

	/** Persist the tuning knobs the user edits on this page. */
	function persistGoal() {
		try {
			localStorage.setItem(
				GOAL_KEY,
				JSON.stringify({ limitMil, targetMil: goalTargetMil, savingMil: goalSavingMil })
			);
		} catch {
			/* ignore quota errors */
		}
	}

	/** Every month of the (reference-filtered) Viajes history. */
	const series = $derived(viajesMonthSeries(dataStore.rows, dataStore.refMonth));
	/** The window the chart shows. */
	const points = $derived(range > 0 ? series.slice(-range) : series);

	/** Trip counts/averages per group, over the whole visible history. */
	const stats = $derived(tripStats(dataStore.rows));

	/** Viajes piggy bank — reused for the budget bar at the bottom. */
	const bank = $derived(dataStore.piggyBanks.find((b) => b.categoria === 'Viajes'));
	const aporte = $derived(bank?.aporte ?? 0);
	const gastoMes = $derived(bank?.esteMes ?? 0);
	const budgetPct = $derived(bank?.budgetPct ?? null);
	const restante = $derived(aporte > 0 ? aporte - gastoMes : null);

	/** Total of the visible window, in thousands (for the card headline). */
	const windowTotal = $derived(points.reduce((sum, point) => sum + point.total, 0));

	const carTarget = $derived(goalTargetMil * 1000);
	const carSaving = $derived(goalSavingMil * 1000);
	const carMonths = $derived(carGoalMonths(carTarget, carSaving));

	/** Stacked bars (one per group) + dashed trend line + the limit reference. */
	const chartOption = $derived.by(() => {
		const labels = points.map((point) => point.mes);

		const bars = VIAJES_GROUPS.map((group) => ({
			name: group.label,
			type: 'bar',
			stack: 'total',
			barMaxWidth: 34,
			itemStyle: { color: group.color },
			emphasis: { focus: 'series' },
			data: points.map((point) => Math.round((point.totals[group.key] ?? 0) / 1000))
		}));

		const trend = linearTrend(points.map((point) => point.total)).map((value) =>
			Math.round(value / 1000)
		);

		const trendSeries = {
			name: 'Tendencia',
			type: 'line',
			symbol: 'none',
			smooth: false,
			z: 5,
			lineStyle: { type: 'dashed', width: 2, color: '#0f172a' },
			itemStyle: { color: '#0f172a' },
			data: trend,
			markLine: {
				silent: true,
				symbol: 'none',
				lineStyle: { color: '#dc2626', type: 'dashed', width: 1.5 },
				label: { formatter: `Límite {c}`, position: 'insideEndTop', fontSize: 10 },
				data: [{ yAxis: limitMil }]
			}
		};

		return {
			grid: { left: 6, right: 18, top: 16, bottom: 34, containLabel: true },
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				valueFormatter: (value: unknown) => formatCurrency(Number(value) * 1000)
			},
			legend: {
				bottom: 0,
				icon: 'roundRect',
				itemWidth: 10,
				itemHeight: 10,
				textStyle: { fontSize: 11 }
			},
			xAxis: {
				type: 'category',
				data: labels,
				axisTick: { show: false },
				axisLine: { lineStyle: { color: '#d1d5db' } }
			},
			yAxis: {
				type: 'value',
				name: 'mil ₡',
				nameTextStyle: { fontSize: 10 },
				axisLabel: { fontSize: 11, formatter: (value: number) => value.toLocaleString('de-DE') },
				splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)' } }
			},
			series: [...bars, trendSeries]
		};
	});

	/** Tone for the budget pill: green ≤ 50%, amber ≤ 85%, red above. */
	function pctTone(pct: number | null): string {
		if (pct == null) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
		if (pct > 0.85) return 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400';
		if (pct > 0.5) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
		return 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400';
	}

	function barTone(pct: number | null): string {
		if (pct == null) return 'bg-gray-300 dark:bg-gray-700';
		if (pct > 0.85) return 'bg-red-500';
		if (pct > 0.5) return 'bg-amber-500';
		return 'bg-green-500';
	}
</script>

<svelte:head>
	<title>Viajes | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-7xl space-y-5">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Viajes</h1>
	</header>

	{#if dataStore.loading}
		<p class="text-sm text-gray-500">Cargando datos…</p>
	{/if}

	<!-- Stacked bars by persona + trend + limit line, with a quick range filter -->
	<Card>
		{#snippet header()}
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">Gasto por mes</h2>
					<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
						Total del rango: <strong class="font-semibold text-gray-700 dark:text-gray-200">
							{formatCurrency(windowTotal)}
						</strong> · barras por persona, línea punteada = tendencia
					</p>
				</div>
				<RangeToggle value={range} onchange={(value) => (range = value)} />
			</div>
		{/snippet}

		{#if points.length === 0}
			<p class="text-sm text-gray-500 dark:text-gray-400">Sin viajes en este periodo.</p>
		{:else}
			<EChart option={chartOption} height={340} />
		{/if}

		<div class="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
			<label for="viajes-limit" class="text-sm font-medium text-gray-600 dark:text-gray-300">
				Límite mensual (mil ₡)
			</label>
			<input
				id="viajes-limit"
				type="number"
				min="0"
				step="5"
				bind:value={limitMil}
				oninput={persistGoal}
				class="w-24 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
			/>
			<span class="text-xs text-gray-400 dark:text-gray-500">
				= {formatCurrency(limitMil * 1000)}
			</span>
		</div>
	</Card>

	<!-- Trip counts + averages by persona and service -->
	<Card
		title="Promedio por viaje"
		subtitle="Cuántos viajes hace cada persona y cuánto cuesta cada uno · Uber y Didi por separado"
	>
		<TripStatsTable {stats} />
	</Card>

	<!-- Turn the Andrés/Trabajo spend into an electric-car goal -->
	<Card
		title="Meta: carro eléctrico"
		subtitle="Cuánto necesitas ahorrar y cuánto tardarías al ritmo que elijas"
	>
		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="car-target" class="block text-sm font-medium text-gray-600 dark:text-gray-300">
					Precio del carro (mil ₡)
				</label>
				<input
					id="car-target"
					type="number"
					min="0"
					step="100"
					bind:value={goalTargetMil}
					oninput={persistGoal}
					class="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
				/>
				<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatCurrency(carTarget)}</p>
			</div>
			<div>
				<label for="car-saving" class="block text-sm font-medium text-gray-600 dark:text-gray-300">
					Ahorro mensual (mil ₡)
				</label>
				<input
					id="car-saving"
					type="number"
					min="0"
					step="25"
					bind:value={goalSavingMil}
					oninput={persistGoal}
					class="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
				/>
				<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatCurrency(carSaving)}/mes</p>
			</div>
		</div>

		<div class="mt-4 rounded-xl bg-primary/5 p-3">
			{#if carMonths == null}
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Define un ahorro mensual para estimar cuándo alcanzas la meta.
				</p>
			{:else}
				<p class="text-sm text-gray-600 dark:text-gray-300">
					Ahorrando <strong class="text-gray-900 dark:text-gray-100">{formatCurrency(carSaving)}</strong>
					al mes llegas a la meta en
					<strong class="text-primary">{carMonths}</strong>
					meses
					<span class="text-gray-400 dark:text-gray-500">
						(~{(carMonths / 12).toFixed(1)} años)
					</span>
					.
				</p>
			{/if}
		</div>
	</Card>

	<!-- Budget progress for Viajes (same shape as the category pages) -->
	<Card>
		<div class="flex items-baseline justify-between gap-3">
			<p class="flex flex-wrap items-baseline gap-x-1 text-sm text-gray-500 dark:text-gray-400">
				<span>Gastado en {formatYearMonth(dataStore.refMonth)}</span>
				<span class="font-semibold text-gray-900 dark:text-gray-50">
					{formatThousands(gastoMes)}
				</span>
				{#if aporte > 0}
					<span class="font-normal text-gray-400 dark:text-gray-500">
						de {formatThousands(aporte)}
					</span>
				{/if}
			</p>
			<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold {pctTone(budgetPct)}">
				{formatPct(budgetPct)}
			</span>
		</div>

		<div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
			<div
				class="h-full rounded-full {barTone(budgetPct)}"
				style="width: {Math.min(100, (budgetPct ?? 0) * 100)}%"
			></div>
		</div>

		{#if restante != null}
			<div class="mt-2 flex items-center justify-between text-xs">
				<span class="font-medium text-gray-500 dark:text-gray-400">
					{restante >= 0 ? 'Presupuesto restante' : 'Excedido por'}
				</span>
				<span
					class="font-semibold {restante >= 0
						? 'text-gray-700 dark:text-gray-200'
						: 'text-red-600 dark:text-red-400'}"
				>
					{formatThousands(Math.abs(restante))}
				</span>
			</div>
		{:else}
			<p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
				Configura tu aporte en <a class="underline" href="/settings">Configuración</a> para ver tu
				%.
			</p>
		{/if}
	</Card>
</section>

