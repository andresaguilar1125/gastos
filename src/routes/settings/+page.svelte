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
	import { CATEGORY_COLORS } from '$lib/config';

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

	const categories = $derived(
		Object.keys(DEFAULT_BUDGETS).filter((c) => c !== 'Ahorro').concat('Ahorro')
	);

	/** Label of the month currently being evaluated. */
	const currentLabel = $derived(
		dataStore.latestMonth ? (MONTH_ES[dataStore.latestMonth] ?? dataStore.latestMonth) : '—'
	);

	let urlInput = $state(dataStore.dataUrl);

	/** Draft values shown in the inputs (unsaved until "Guardar cambios"). */
	function draftCap(c: string): number {
		return budgetStore.draft[c]?.cap ?? 0;
	}

	function updateCap(c: string, value: string) {
		budgetStore.update(c, Number(value));
	}

	function discard() {
		budgetStore.discard();
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

	/** Percentage of the cap used, capped visually at 100%. */
	function usedPct(spent: number, capMil: number): number {
		const capReal = capMil * BUDGET_SCALE;
		return capReal > 0 ? Math.min(100, Math.round((spent / capReal) * 100)) : 0;
	}
</script>

<svelte:head>
	<title>Configuración | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-7xl space-y-6">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Configuración</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">Ajusta presupuestos, la URL de datos y el factor de ahorro.</p>
	</header>

	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<h2 class="mb-4 text-lg font-semibold">Fuente de datos</h2>
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

	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<h2 class="mb-4 text-lg font-semibold">Factor de ahorro</h2>
		<label for="ahorro-factor" class="block text-sm font-medium">Veces que se duplica la categoría Ahorro</label>
		<input
			id="ahorro-factor"
			type="number"
			min="1"
			step="1"
			value={settingsStore.ahorroFactor}
			oninput={(e) => (settingsStore.ahorroFactor = Number(e.currentTarget.value))}
			class="mt-1 w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
		/>
	</div>

	<!-- DEV ONLY: remove this block for production -->
	{#if dev}
		<div
			class="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/40"
		>
			<div class="flex items-center gap-2">
				<h2 class="text-lg font-semibold text-amber-900 dark:text-amber-200">Mes actual (dev)</h2>
				<span
					class="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white"
				>
					solo dev
				</span>
			</div>
			<p class="mt-1 text-sm text-amber-800 dark:text-amber-300">
				Fuerza el mes mostrado como "actual" en el dashboard y las vistas por categoría.
				Solo para desarrollo; se elimina al desplegar.
			</p>

			<label for="dev-month" class="mt-3 block text-sm font-medium text-amber-900 dark:text-amber-200">
				Mes mostrado como actual
			</label>
			<select
				id="dev-month"
				value={dataStore.devMonthOverride ?? ''}
				onchange={(e) => dataStore.setDevMonthOverride(e.currentTarget.value || null)}
				class="mt-1 w-full max-w-xs rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm dark:border-amber-700 dark:bg-gray-800"
			>
				<option value="">Automático (último mes con datos)</option>
				{#each dataStore.availableMonths as mes (mes)}
					{@const label = MONTH_ES[mes] ?? mes}
					<option value={mes}>{label}</option>
				{/each}
			</select>

			{#if dataStore.devMonthOverride}
				<p class="mt-2 text-xs text-amber-800 dark:text-amber-300">
					Activo: <strong>{MONTH_ES[dataStore.devMonthOverride] ?? dataStore.devMonthOverride}</strong>.
					El mes anterior se compara automáticamente.
				</p>
			{/if}
		</div>
	{/if}

	<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">Presupuestos por categoría</h2>
			<button
				type="button"
				onclick={resetAll}
				class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
			>
				Restablecer todo
			</button>
		</div>

		<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
			Gasto actual de <strong>{currentLabel}</strong> comparado con cada tope mensual.
		</p>

		<div class="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
			Define un <strong>tope máximo mensual</strong> por categoría, <strong>en miles de colones</strong>.
			Un tope de <strong>70</strong> significa que no quieres gastar más de
			{formatCurrency(70 * BUDGET_SCALE)} <strong>por mes</strong>.
			Los topes se reinician el <strong>1.º de cada mes</strong>.
		</div>

		<div class="space-y-4">
			{#each categories as c}
				{@const draftBudget = budgetStore.draft[c] ?? DEFAULT_BUDGETS[c as keyof typeof DEFAULT_BUDGETS]}
				{@const committed = budgetStore.budgets[c] ?? DEFAULT_BUDGETS[c as keyof typeof DEFAULT_BUDGETS]}
				{@const spent = spendFor(c)}
				{@const color = CATEGORY_COLORS[c as keyof typeof CATEGORY_COLORS] ?? '#888'}
				{@const capReal = draftBudget.cap * BUDGET_SCALE}
				{@const pct = usedPct(spent, draftBudget.cap)}
				{@const over = capReal > 0 && spent > capReal}
				{@const changed = (committed?.cap ?? 0) !== draftBudget.cap}
				<div class="rounded-lg border p-3 {over ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : 'border-gray-100 dark:border-gray-800'}">
					<div class="flex flex-wrap items-center gap-3">
						<span
							class="inline-block h-3 w-3 rounded-full"
							style="background-color: {color}"
						></span>
						<h3 class="min-w-[8rem] font-semibold">{c}</h3>

						<div class="flex items-center gap-2">
							<span class="text-sm text-gray-500 dark:text-gray-400">Tope</span>
							<input
								type="number"
								min="0"
								step="1"
								aria-label="{c} tope (miles de colones)"
								value={draftBudget.cap}
								oninput={(e) => updateCap(c, e.currentTarget.value)}
								class="w-24 rounded-lg border px-2 py-1 text-sm {changed
									? 'border-primary bg-primary/5'
									: 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800'}"
							/>
							<span class="text-xs text-gray-400">mil ₡</span>
						</div>

						<span class="text-xs text-gray-500 dark:text-gray-400">
							= máx {formatCurrency(capReal)}
						</span>

						{#if changed}
							<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
								sin guardar
							</span>
						{/if}

						<button
							type="button"
							onclick={() => budgetStore.reset(c)}
							class="ml-auto rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Restablecer
						</button>
					</div>

					<div class="mt-3">
						<p class="mb-1 text-xs {over ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}">
							{currentLabel}: {formatCurrency(spent)} de {formatCurrency(capReal)} · {pct}%
							{#if over}
								· excedido por {formatCurrency(spent - capReal)}
							{/if}
						</p>
						<div class="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
							<div
								class="h-full rounded-full transition-all"
								style="width: {pct}%; background-color: {over ? '#dc2626' : color}"
							></div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Save bar -->
		<div
			class="sticky bottom-20 mt-5 flex flex-wrap items-center gap-3 rounded-xl border bg-white/95 p-3 backdrop-blur dark:bg-gray-900/95 md:bottom-4 {budgetStore.isDirty()
				? 'border-primary/40'
				: 'border-gray-200 dark:border-gray-800'}"
		>
			<span class="text-sm {budgetStore.isDirty() ? 'font-medium text-primary' : 'text-gray-500 dark:text-gray-400'}">
				{budgetStore.isDirty() ? 'Tienes cambios sin guardar' : 'Sin cambios pendientes'}
			</span>

			<div class="ml-auto flex items-center gap-2">
				<button
					type="button"
					onclick={discard}
					disabled={!budgetStore.isDirty()}
					class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Descartar
				</button>
				<button
					type="button"
					onclick={save}
					disabled={!budgetStore.isDirty()}
					class="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
				>
					Guardar cambios
				</button>
			</div>
		</div>

		{#if budgetStore.savedAt}
			<p class="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
				Presupuestos guardados · {budgetStore.savedAt.toLocaleTimeString('es-CR')}
			</p>
		{/if}
	</div>
</section>
