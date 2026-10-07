<script lang="ts">
	import { dataStore, planStore, savingsStore } from '$lib/stores/index.svelte';
	import { formatCurrency } from '$lib/format';
	import { formatYearMonth } from '$lib/data/aggregates';
	import { savingsMonths, savingsProgress, savingsTotals } from '$lib/budget/savings';
	import { APORTE_SCALE } from '$lib/config';
	import { setPageTitle } from '$lib/ui/theme';
	import Card from '$lib/components/Card.svelte';
	import IconPicker from '$lib/components/IconPicker.svelte';
	import SavingsLinesTable from '$lib/components/SavingsLinesTable.svelte';

	setPageTitle('Ahorros');

	/** Months elapsed this year (Ahorros resets every January). */
	const months = $derived(savingsMonths(dataStore.rows, dataStore.refMonth));

	/** Every line resolved against the elapsed months. */
	const progress = $derived(savingsProgress(savingsStore.lines, months));

	/** Page totals: Σ lines. */
	const totals = $derived(savingsTotals(progress, months));

	const ingreso = $derived(planStore.ingreso * APORTE_SCALE);
	const pctAhorro = $derived(ingreso > 0 ? totals.aporteMensual / ingreso : null);

	/** Ingreso − gasto total (sin Ahorros) − aporte total de Ahorros. */
	const disponible = $derived(
		ingreso > 0 ? ingreso - dataStore.refMonthSum - totals.aporteMensual : null
	);

	const refLabel = $derived(formatYearMonth(dataStore.refMonth));

	// --- Add-line form state -------------------------------------------------
	let open = $state(false);
	let newName = $state('');
	let newAmount = $state(0);
	let newIcon = $state('PiggyBank');

	function submitLine() {
		const name = newName.trim();
		if (!name || newAmount <= 0) return;
		savingsStore.addLine({ name, icon: newIcon, amountMil: newAmount });
		cancelAdd();
	}

	function cancelAdd() {
		open = false;
		newName = '';
		newAmount = 0;
		newIcon = 'PiggyBank';
	}

	const canSubmit = $derived(newName.trim().length > 0 && newAmount > 0);
</script>

<svelte:head>
	<title>Ahorros | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-5xl space-y-5">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Ahorros</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			Varias líneas de ahorro, cada una con su nombre, icono y monto mensual. El ahorro es una
			alcancía con <strong>cero retiros</strong>: el saldo es la suma de los aportes, y el
			contador reinicia cada enero.
		</p>
	</header>

	<Card>
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Ahorro acumulado</p>
				<p class="mt-1 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
					{formatCurrency(totals.acumulado)}
				</p>
				<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
					{totals.months} {totals.months === 1 ? 'mes' : 'meses'} ×
					{formatCurrency(totals.aporteMensual)} · {refLabel}
				</p>
			</div>
			<div class="text-right">
				<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Meta fin de año</p>
				<p class="text-lg font-semibold text-gray-700 dark:text-gray-200">
					{formatCurrency(totals.metaEOY)}
				</p>
			</div>
		</div>

		<div class="mt-5">
			<div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
				<span>Progreso del año</span>
				<span>{totals.progressPct}%</span>
			</div>
			<div class="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
				<div class="h-full rounded-full bg-primary" style="width: {totals.progressPct}%"></div>
			</div>
		</div>
	</Card>

	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Aporte mensual</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(totals.aporteMensual)}</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">% del ingreso</p>
			<p class="mt-1 text-xl font-bold">
				{pctAhorro != null ? `${Math.round(pctAhorro * 100)}%` : '—'}
			</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Disponible</p>
			<p class="mt-1 text-xl font-bold">
				{disponible != null ? formatCurrency(disponible) : '—'}
			</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
			<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Gasto del mes</p>
			<p class="mt-1 text-xl font-bold">{formatCurrency(dataStore.refMonthSum)}</p>
		</div>
	</div>

	<Card>
		{#snippet header()}
			<div class="flex w-full flex-wrap items-center justify-between gap-2">
				<div>
					<h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">Mis ahorros</h2>
					<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
						{savingsStore.lines.length}
						{savingsStore.lines.length === 1 ? 'línea' : 'líneas'} · montos en miles de colones
					</p>
				</div>
				{#if !open}
					<button
						type="button"
						onclick={() => (open = true)}
						class="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark"
					>
						Agregar línea
					</button>
				{/if}
			</div>
		{/snippet}

		{#if open}
			<div class="mb-4 rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700">
				<div class="flex flex-wrap items-center gap-3">
					<input
						type="text"
						aria-label="Nombre de la línea"
						bind:value={newName}
						placeholder="Nombre (ej. Auto, Emergencias)"
						class="min-w-48 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
					/>
					<div class="flex items-center gap-2">
						<input
							type="number"
							min="0"
							step="1"
							aria-label="Monto mensual (mil ₡)"
							bind:value={newAmount}
							placeholder="0"
							class="w-28 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
						/>
						<span class="text-xs text-gray-500 dark:text-gray-400">mil ₡</span>
					</div>
				</div>
				<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
					= {formatCurrency(Math.max(0, newAmount) * APORTE_SCALE)} / mes
				</p>
				<div class="mt-3">
					<p class="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Icono</p>
					<IconPicker value={newIcon} onselect={(name) => (newIcon = name)} />
				</div>
				<div class="mt-3 flex items-center justify-end gap-2">
					<button
						type="button"
						onclick={cancelAdd}
						class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						Cancelar
					</button>
					<button
						type="button"
						onclick={submitLine}
						disabled={!canSubmit}
						class="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
					>
						Agregar
					</button>
				</div>
			</div>
		{/if}

		{#if progress.length === 0}
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Sin líneas de ahorro todavía. Usa <strong>Agregar línea</strong> para crear tu primera
				meta.
			</p>
		{:else}
			<SavingsLinesTable lines={progress} />
		{/if}
	</Card>
</section>
