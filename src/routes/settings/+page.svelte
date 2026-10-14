<script lang="ts">
	import { dataStore, planStore, DATA_URL } from '$lib/stores/index.svelte';
	import { formatCurrency } from '$lib/format';
	import { APORTE_SCALE, CATEGORIES, RANGE_MONTH_OPTIONS } from '$lib/config';
	import { categoryColor } from '$lib/ui/colors.svelte';
	/** Category list for the aportes table. */
	const categories = [...CATEGORIES];

	let urlInput = $state(dataStore.dataUrl);

	// Re-sync the input when the persisted URL changes (hydrate or a save).
	$effect(() => {
		urlInput = dataStore.dataUrl;
	});

	/** Any unsaved change: plan draft or the CSV URL. */
	const dirty = $derived(
		planStore.isDirty() || (urlInput.trim() || DATA_URL) !== dataStore.dataUrl
	);

	/** Commit every setting at once; reloads the data only when the URL changed. */
	function save() {
		planStore.save();
		const url = urlInput.trim() || DATA_URL;
		if (url !== dataStore.dataUrl) dataStore.setUrl(url);
	}
</script>

<svelte:head>
	<title>Configuración | Gastos</title>
</svelte:head>

<section class="mx-auto max-w-5xl space-y-6">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">Configuración</h1>
		<p class="text-sm text-accent-4">
			Los cambios se aplican al pulsar «Guardar cambios».
		</p>
	</header>

	<!-- Ingreso -->
	<div
		class="rounded-xl border border-accent-4/20 bg-white p-4 shadow-sm"
	>
		<h2 class="text-base font-semibold">Ingreso mensual</h2>
		<label for="ingreso" class="mt-2 block text-sm font-medium">Ingreso (mil ₡)</label>
		<div class="mt-1 flex items-center gap-3">
			<input
				id="ingreso"
				type="number"
				min="0"
				step="1"
				value={planStore.draftIngreso}
				oninput={(e) => planStore.updateIngreso(Number(e.currentTarget.value))}
				class="w-32 rounded-md border border-accent-4/30 bg-white px-2 py-1.5 text-sm"
			/>
			<span class="text-sm text-accent-4">
				= {formatCurrency(planStore.draftIngreso * APORTE_SCALE)}
			</span>
		</div>
	</div>

	<!-- Ahorro mensual -->
	<div
		class="rounded-xl border border-accent-4/20 bg-white p-4 shadow-sm"
	>
		<h2 class="text-base font-semibold">Ahorro mensual</h2>
		<label for="ahorro" class="mt-2 block text-sm font-medium">Ahorro (mil ₡)</label>
		<div class="mt-1 flex items-center gap-3">
			<input
				id="ahorro"
				type="number"
				min="0"
				step="1"
				value={planStore.draftAhorroMensual}
				oninput={(e) => planStore.updateAhorroMensual(Number(e.currentTarget.value))}
				class="w-32 rounded-md border border-accent-4/30 bg-white px-2 py-1.5 text-sm"
			/>
			<span class="text-sm text-accent-4">
				= {formatCurrency(planStore.draftAhorroMensual * APORTE_SCALE)}
			</span>
		</div>
	</div>

	<!-- Data window -->
	<div
		class="rounded-xl border border-accent-4/20 bg-white p-4 shadow-sm"
	>
		<h2 class="text-base font-semibold">Rango de datos</h2>
		<p class="mt-2 text-sm font-medium">Meses</p>
		<div class="mt-1 flex flex-wrap gap-2">
			{#each RANGE_MONTH_OPTIONS as months (months)}
				{@const active = planStore.draftRangeMonths === months}
				<button
					type="button"
					onclick={() => planStore.updateRangeMonths(months)}
					aria-pressed={active}
					class="rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors {active
						? 'border-accent-3 bg-accent-3/10 text-accent-3'
						: 'border-accent-4/30 text-accent-4 hover:bg-accent-4/10 '}"
				>
					{months}
				</button>
			{/each}
		</div>
	</div>

	<!-- Aportes per category -->
	<div
		class="rounded-xl border border-accent-4/20 bg-white p-4 shadow-sm"
	>
		<h2 class="text-base font-semibold">Aportes mensuales por sobre</h2>

		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr
						class="border-b border-accent-4/20 text-left text-xs uppercase tracking-wide text-accent-4/70"
					>
						<th class="py-2 pr-4 font-medium">Categoría</th>
						<th class="py-2 font-medium">Aporte (mil)</th>
					</tr>
				</thead>
				<tbody>
					{#each categories as c (c)}
						{@const committed = planStore.aportes[c] ?? 0}
						{@const value = planStore.draftAportes[c] ?? 0}
						{@const changed = committed !== value}
						<tr class="border-b border-accent-4/10 last:border-0">
							<td class="py-2 pr-4 font-medium text-accent-5">
								<span class="inline-flex items-center gap-2">
									<span class="h-3 w-1.5 rounded-full" style="background-color: {categoryColor(c)}"
									></span>
									{c}
								</span>
								{#if changed}
									<span class="ml-2 text-[10px] font-bold uppercase text-accent-3">editado</span>
								{/if}
							</td>
							<td class="py-2">
								<input
									type="number"
									min="0"
									step="1"
									aria-label="{c} aporte (miles de colones)"
									{value}
									oninput={(e) => planStore.updateAporte(c, Number(e.currentTarget.value))}
									class="w-24 rounded-md border px-2 py-1 text-sm {changed
										? 'border-accent-3'
										: 'border-accent-4/30 '} bg-white "
								/>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Data source -->
	<div
		class="rounded-xl border border-accent-4/20 bg-white p-4 shadow-sm"
	>
		<h2 class="text-base font-semibold">Fuente de datos</h2>
		<label for="csv-url" class="mt-2 block text-sm font-medium">URL del CSV pública</label>
		<input
			id="csv-url"
			type="url"
			bind:value={urlInput}
			class="mt-1 w-full rounded-lg border border-accent-4/30 bg-white px-3 py-2 text-sm"
			placeholder={DATA_URL}
		/>
	</div>

	<!-- Single action bar: saves every card (plan + URL) -->
	<div
		class="sticky bottom-16 z-30 -mx-4 border-t border-accent-4/20 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-xl md:border"
	>
		<div class="flex items-center justify-between gap-3">
			<span class="text-xs text-accent-4">
				{#if dirty}
					Hay cambios sin guardar.
				{:else if planStore.savedAt}
					Guardado · {planStore.savedAt.toLocaleTimeString('es-CR')}
				{:else}
					Todo guardado.
				{/if}
			</span>
			<button
				type="button"
				onclick={save}
				disabled={!dirty}
				class="rounded-lg bg-accent-3 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-3/90 disabled:cursor-not-allowed disabled:opacity-40"
			>
				Guardar cambios
			</button>
		</div>
	</div>
</section>
