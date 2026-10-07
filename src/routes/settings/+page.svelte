<script lang="ts">
	import { dataStore, planStore, DATA_URL } from '$lib/stores/index.svelte';
	import { formatCurrency, toDisplayValue } from '$lib/format';
	import { formatYearMonth } from '$lib/data/aggregates';
	import { averagePerMonth } from '$lib/budget/piggy';
	import { APORTE_SCALE, CATEGORIES, CATEGORY_COLORS } from '$lib/config';

	/** Category list for the aportes table. */
	const categories = [...CATEGORIES];

	const refLabel = $derived(formatYearMonth(dataStore.refMonth));

	let urlInput = $state(dataStore.dataUrl);

	function save() {
		planStore.save();
	}

	function resetAll() {
		if (confirm('¿Restablecer el ingreso y todos los aportes a 0?')) {
			planStore.resetAll();
		}
	}

	function saveUrl() {
		dataStore.setUrl(urlInput.trim() || DATA_URL);
	}

	function suggest(c: string) {
		const avg = averagePerMonth(dataStore.rows, c, 6);
		planStore.updateAporte(c, avg);
	}

	/** Current-month spend for a category (gasto, not aporte). */
	function spendFor(c: string): number {
		return dataStore.categoryMomSums.find((a) => a.categoria === c)?.current ?? 0;
	}
</script>

<svelte:head>
	<title>Configuración | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-5xl space-y-6">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Configuración</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			Ingreso mensual, aportes por alcancía, mes de referencia y fuente de datos.
		</p>
	</header>

	<!-- Ingreso: enables pctAhorro and disponible -->
	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<h2 class="text-base font-semibold">Ingreso mensual</h2>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
			En <strong>miles de colones</strong>. Habilita el % de ahorro y el disponible. Deja en 0
			para ocultarlos.
		</p>
		<label for="ingreso" class="mt-3 block text-sm font-medium">Ingreso (mil ₡)</label>
		<div class="mt-1 flex items-center gap-3">
			<input
				id="ingreso"
				type="number"
				min="0"
				step="1"
				value={planStore.draftIngreso}
				oninput={(e) => planStore.updateIngreso(Number(e.currentTarget.value))}
				class="w-32 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
			/>
			<span class="text-sm text-gray-500 dark:text-gray-400">
				= {formatCurrency(planStore.draftIngreso * APORTE_SCALE)}
			</span>
		</div>
	</div>

	<!-- Aportes per category -->
	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-base font-semibold">Aportes mensuales por alcancía</h2>
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
					disabled={!planStore.isDirty()}
					class="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
				>
					Guardar cambios
				</button>
			</div>
		</div>

		<p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
			Montos <strong>en miles de colones</strong>. El aporte se paga cada mes transcurrido y el
			saldo arrastra para siempre. {#if planStore.isDirty()}
				<span class="font-medium text-primary">Hay cambios sin guardar.</span>
			{/if}
		</p>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr
						class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800"
					>
						<th class="py-2 pr-4 font-medium">Categoría</th>
						<th class="py-2 pr-4 font-medium">Aporte (mil)</th>
						<th class="py-2 pr-4 font-medium">Aporte CRC</th>
						<th class="py-2 pr-4 font-medium">Gasto ({refLabel})</th>
						<th class="py-2 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each categories as c (c)}
						{@const committed = planStore.aportes[c] ?? 0}
						{@const value = planStore.draftAportes[c] ?? 0}
						{@const changed = committed !== value}
						{@const spend = spendFor(c)}
						{@const over = value > 0 && spend > value * APORTE_SCALE}
						<tr class="border-b border-gray-100 last:border-0 dark:border-gray-800">
							<td class="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">
								<span class="inline-flex items-center gap-2">
									<span
										class="h-3 w-1.5 rounded-full"
										style="background-color: {CATEGORY_COLORS[c] ?? '#94a3b8'}"
									></span>
									{c}
								</span>
								{#if changed}
									<span class="ml-2 text-[10px] font-bold uppercase text-primary">editado</span>
								{/if}
							</td>
							<td class="py-2 pr-4">
								<input
									type="number"
									min="0"
									step="1"
									aria-label="{c} aporte (miles de colones)"
									value={value}
									oninput={(e) => planStore.updateAporte(c, Number(e.currentTarget.value))}
									class="w-24 rounded-md border px-2 py-1 text-sm {changed
										? 'border-primary'
										: 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800"
								/>
							</td>
							<td class="py-2 pr-4 text-gray-500 dark:text-gray-400">
								{formatCurrency(value * APORTE_SCALE)}
							</td>
							<td
								class="py-2 pr-4 {over
									? 'font-medium text-red-600 dark:text-red-400'
									: 'text-gray-500 dark:text-gray-400'}"
							>
								{formatCurrency(spend)}
							</td>
							<td class="py-2 text-right">
								<div class="flex items-center justify-end gap-2">
									<button
										type="button"
										onclick={() => suggest(c)}
										class="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
										title="Promedio de los últimos 6 meses"
									>
										Sugerir
									</button>
									<button
										type="button"
										onclick={() => planStore.reset(c)}
										class="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
									>
										Restablecer
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if planStore.savedAt}
			<p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
				Guardado · {planStore.savedAt.toLocaleTimeString('es-CR')}
			</p>
		{/if}
	</div>

	<!-- Reference month: truncates the ENTIRE dataset -->
	<div
		class="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/40"
	>
		<div class="flex flex-wrap items-center gap-2">
			<h2 class="text-base font-semibold text-amber-900 dark:text-amber-200">Mes de referencia</h2>
			<span class="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
				temporal
			</span>
		</div>
		<p class="mt-1 text-sm text-amber-800 dark:text-amber-300">
			Filtra <strong>todo</strong> el conjunto de datos hasta el mes elegido: los meses
			posteriores se ocultan por completo.
		</p>

		<label for="month-filter" class="mt-3 block text-sm font-medium text-amber-900 dark:text-amber-200">
			Mes actual
		</label>
		<select
			id="month-filter"
			value={dataStore.monthFilter ?? ''}
			onchange={(e) => dataStore.setMonthFilter(e.currentTarget.value || null)}
			class="mt-1 w-full max-w-xs rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm dark:border-amber-700 dark:bg-gray-800"
		>
			<option value="">
				Automático ({formatYearMonth(dataStore.latestAvailableMonth)})
			</option>
			{#each dataStore.allMonths as ym (ym)}
				<option value={ym}>{formatYearMonth(ym)}</option>
			{/each}
		</select>

		{#if dataStore.monthFilter}
			<p class="mt-2 text-xs text-amber-800 dark:text-amber-300">
				Mostrando hasta <strong>{refLabel}</strong>.
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
