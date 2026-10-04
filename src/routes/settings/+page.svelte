<script lang="ts">
	import { dataStore, budgetStore, settingsStore, DEFAULT_BUDGETS, DATA_URL } from '$lib/stores/index.svelte';
	import type { BudgetMode } from '$lib/stores/index.svelte';
	import { formatCurrency, clamp } from '$lib/budget/status';
	import { CATEGORY_COLORS } from '$lib/config';

	const modes: { value: BudgetMode; label: string }[] = [
		{ value: 'exhaust', label: 'Agotar' },
		{ value: 'cap', label: 'Tope' },
		{ value: 'range', label: 'Rango' },
		{ value: 'target', label: 'Meta' }
	];

	const categories = $derived(
		Object.keys(DEFAULT_BUDGETS).filter((c) => c !== 'Ahorro').concat('Ahorro')
	);

	let urlInput = $state(dataStore.dataUrl);

	function updateMin(c: string, value: string) {
		const num = Math.max(0, Math.ceil(Number(value) || 0));
		const max = budgetStore.budgets[c]?.max ?? DEFAULT_BUDGETS[c as keyof typeof DEFAULT_BUDGETS].max;
		budgetStore.update(c, { min: Math.min(num, max) });
	}

	function updateMax(c: string, value: string) {
		const num = Math.max(0, Math.ceil(Number(value) || 0));
		const min = budgetStore.budgets[c]?.min ?? DEFAULT_BUDGETS[c as keyof typeof DEFAULT_BUDGETS].min;
		budgetStore.update(c, { max: Math.max(num, min) });
	}

	function updateMode(c: string, value: BudgetMode) {
		budgetStore.update(c, { mode: value });
	}

	function resetAll() {
		if (confirm('¿Restablecer todos los presupuestos a los valores por defecto?')) {
			budgetStore.resetAll();
		}
	}

	function saveUrl() {
		dataStore.setUrl(urlInput.trim() || DATA_URL);
	}

	function spendFor(c: string): number {
		return dataStore.categorySums.find((a) => a.categoria === c)?.sum ?? 0;
	}
</script>

<svelte:head>
	<title>Configuración | Finanzas CRC</title>
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

		<div class="space-y-4">
			{#each categories as c}
				{@const budget = budgetStore.budgets[c] ?? DEFAULT_BUDGETS[c as keyof typeof DEFAULT_BUDGETS]}
				{@const spent = spendFor(c)}
				{@const color = CATEGORY_COLORS[c as keyof typeof CATEGORY_COLORS] ?? '#888'}
				<div class="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
					<div class="flex flex-wrap items-center gap-3">
						<span
							class="inline-block h-3 w-3 rounded-full"
							style="background-color: {color}"
						></span>
						<h3 class="min-w-[8rem] font-semibold">{c}</h3>

						<select
							value={budget.mode}
							onchange={(e) => updateMode(c, e.currentTarget.value as BudgetMode)}
							class="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
						>
							{#each modes as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>

						<div class="flex items-center gap-2">
							<input
								type="number"
								min="0"
								step="1"
								value={budget.min}
								oninput={(e) => updateMin(c, e.currentTarget.value)}
								class="w-28 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
							/>
							<span class="text-gray-400">→</span>
							<input
								type="number"
								min="0"
								step="1"
								value={budget.max}
								oninput={(e) => updateMax(c, e.currentTarget.value)}
								class="w-28 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
							/>
						</div>

						<button
							type="button"
							onclick={() => budgetStore.reset(c)}
							class="ml-auto rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							Restablecer
						</button>
					</div>

					<div class="mt-3">
						<p class="mb-1 text-xs text-gray-500 dark:text-gray-400">
							Actual: {formatCurrency(spent)} · Min: {formatCurrency(budget.min)} · Max: {formatCurrency(budget.max)}
						</p>
						<div class="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
							<div
								class="h-full rounded-full transition-all"
								style="width: {clamp(budget.max ? (spent / budget.max) * 100 : 0, 0, 100)}%; background-color: {color}"
							></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
