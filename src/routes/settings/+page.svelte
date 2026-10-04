<script lang="ts">
	import { dev } from '$app/environment';
	import {
		dataStore,
		budgetStore,
		settingsStore,
		DEFAULT_BUDGETS,
		DATA_URL,
		BUDGET_SCALE
	} from '$lib/stores/index.svelte';
	import { formatCurrency } from '$lib/budget/status';

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

	/** Categories that have a monthly spending cap. */
	const capCategories = Object.keys(DEFAULT_BUDGETS);

	/** Label of the month currently being evaluated. */
	const currentLabel = $derived(
		dataStore.latestMonth ? (MONTH_ES[dataStore.latestMonth] ?? dataStore.latestMonth) : '—'
	);

	let urlInput = $state(dataStore.dataUrl);

	function updateCap(c: string, value: string) {
		budgetStore.update(c, Number(value));
	}

	function save() {
		budgetStore.save();
	}

	function resetAll() {
		if (confirm('¿Restablecer todos los presupuestos a los valores por defecto?')) {
			budgetStore.resetAll();
		}
	}

	function saveUrl() {
		dataStore.setUrl(urlInput.trim() || DATA_URL);
	}

	/** Spend for the CURRENT MONTH only — caps reset on the 1st of each month. */
	function spendFor(c: string): number {
		return dataStore.categoryMomSums.find((a) => a.categoria === c)?.current ?? 0;
	}

	function capFor(c: string): number {
		return budgetStore.draft[c]?.cap ?? DEFAULT_BUDGETS[c as keyof typeof DEFAULT_BUDGETS]?.cap ?? 0;
	}

	/** Percentage of the cap used (can exceed 100). */
	function usedPct(spent: number, capMil: number): number {
		const capReal = capMil * BUDGET_SCALE;
		return capReal > 0 ? Math.round((spent / capReal) * 100) : 0;
	}
</script>

<svelte:head>
	<title>Configuración | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-5xl space-y-6">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Configuración</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			Ajusta el mes, los topes mensuales y la fuente de datos.
		</p>
	</header>

	<!-- Month filter: truncates the ENTIRE dataset, so later months disappear -->
	<!-- TODO(dev): month picker is temporary until the year is complete. -->
	<div class="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/40">
		<div class="flex flex-wrap items-center gap-2">
			<h2 class="text-base font-semibold text-amber-900 dark:text-amber-200">Mes actual</h2>
			<span class="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
				temporal
			</span>
		</div>
		<p class="mt-1 text-sm text-amber-800 dark:text-amber-300">
			Filtra <strong>todo</strong> el conjunto de datos hasta el mes elegido: los meses
			posteriores se ocultan por completo en el dashboard, las tablas y los totales.
		</p>

		<label for="month-filter" class="mt-3 block text-sm font-medium text-amber-900 dark:text-amber-200">
			Mes mostrado como actual
		</label>
		<select
			id="month-filter"
			value={dataStore.monthFilter ?? ''}
			onchange={(e) => dataStore.setMonthFilter(e.currentTarget.value || null)}
			class="mt-1 w-full max-w-xs rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm dark:border-amber-700 dark:bg-gray-800"
		>
			<option value="">Automático ({MONTH_ES[dataStore.latestAvailableMonth ?? ''] ?? '—'})</option>
			{#each dataStore.allMonths as mes (mes)}
				<option value={mes}>{MONTH_ES[mes] ?? mes}</option>
			{/each}
		</select>

		{#if dataStore.monthFilter}
			<p class="mt-2 text-xs text-amber-800 dark:text-amber-300">
				Mostrando hasta <strong>{currentLabel}</strong>.
				La categoría Ahorro se repite {dataStore.availableMonths.length} veces.
			</p>
		{/if}
	</div>

	<!-- Spending caps -->
	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-base font-semibold">Topes mensuales por categoría</h2>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={resetAll}
					class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Restablecer todo
				</button>
				<button
					type="button"
					onclick={save}
					disabled={!budgetStore.isDirty()}
					class="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
				>
					Guardar
				</button>
			</div>
		</div>

		<p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
			Montos <strong>en miles de colones</strong>. Un tope de
			<strong>70</strong> = {formatCurrency(70 * BUDGET_SCALE)} al mes.
			{#if budgetStore.isDirty()}
				<span class="font-medium text-primary">Hay cambios sin guardar.</span>
			{/if}
		</p>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
						<th class="py-2 pr-4 font-medium">Categoría</th>
						<th class="py-2 pr-4 font-medium">Tope (mil ₡)</th>
						<th class="py-2 pr-4 font-medium">Máx. CRC</th>
						<th class="py-2 pr-4 font-medium">Actual ({currentLabel})</th>
						<th class="py-2 pr-4 text-right font-medium">%</th>
						<th class="py-2 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each capCategories as c}
						{@const committed = budgetStore.budgets[c]?.cap ?? DEFAULT_BUDGETS[c as keyof typeof DEFAULT_BUDGETS]?.cap ?? 0}
						{@const cap = capFor(c)}
						{@const spent = spendFor(c)}
						{@const capReal = cap * BUDGET_SCALE}
						{@const pct = usedPct(spent, cap)}
						{@const over = capReal > 0 && spent > capReal}
						{@const changed = committed !== cap}
						<tr class="border-b border-gray-100 last:border-0 dark:border-gray-800">
							<td class="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">
								{c}
								{#if changed}
									<span class="ml-2 text-[10px] font-bold uppercase text-primary">editado</span>
								{/if}
							</td>
							<td class="py-2 pr-4">
								<input
									type="number"
									min="0"
									step="1"
									aria-label="{c} tope (miles de colones)"
									value={cap}
									oninput={(e) => updateCap(c, e.currentTarget.value)}
									class="w-20 rounded-md border px-2 py-1 text-sm {changed
										? 'border-primary'
										: 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800"
								/>
							</td>
							<td class="py-2 pr-4 text-gray-500 dark:text-gray-400">
								{formatCurrency(capReal)}
							</td>
							<td class="py-2 pr-4 {over ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}">
								{formatCurrency(spent)}
							</td>
							<td class="py-2 pr-4 text-right tabular-nums {over ? 'font-semibold text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}">
								{pct}%
							</td>
							<td class="py-2 text-right">
								<button
									type="button"
									onclick={() => budgetStore.reset(c)}
									class="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
								>
									Restablecer
								</button>
							</td>
						</tr>
					{/each}

					<!-- Ahorro: a monthly amount, not a cap -->
					<tr class="border-t border-gray-200 dark:border-gray-800">
						<td class="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">
							Ahorro
							<span class="ml-2 text-[10px] uppercase text-gray-400">monto mensual</span>
						</td>
						<td class="py-2 pr-4">
							<input
								type="number"
								min="0"
								step="1"
								aria-label="Ahorro mensual (miles de colones)"
								value={settingsStore.ahorroMensual}
								oninput={(e) => (settingsStore.ahorroMensual = Number(e.currentTarget.value))}
								class="w-20 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
							/>
						</td>
						<td class="py-2 pr-4 text-gray-500 dark:text-gray-400">
							{formatCurrency(settingsStore.ahorroMensual * BUDGET_SCALE)}
						</td>
						<td class="py-2 pr-4 text-gray-500 dark:text-gray-400">
							{formatCurrency((dataStore.categoryMomSums.find((a) => a.categoria === 'Ahorro')?.current ?? 0))}
						</td>
						<td class="py-2 pr-4 text-right text-gray-400">
							{dataStore.availableMonths.length}×
						</td>
						<td class="py-2 text-right text-xs text-gray-400">fijo</td>
					</tr>
				</tbody>
			</table>
		</div>

		{#if budgetStore.savedAt}
			<p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
				Guardado · {budgetStore.savedAt.toLocaleTimeString('es-CR')}
			</p>
		{/if}
	</div>

	<!-- Data source -->
	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<h2 class="mb-3 text-base font-semibold">Fuente de datos</h2>
		<label for="csv-url" class="block text-sm font-medium">URL del CSV pública</label>
		<div class="mt-1 flex gap-2">
			<input
				id="csv-url"
				type="url"
				bind:value={urlInput}
				class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
				placeholder={DATA_URL}
			/>
			<button
				type="button"
				onclick={saveUrl}
				class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
			>
				Guardar y recargar
			</button>
		</div>
	</div>
</section>
