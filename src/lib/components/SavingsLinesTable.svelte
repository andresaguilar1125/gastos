<script lang="ts">
	import type { SavingsLineProgress } from '$lib/types';
	import { savingsStore } from '$lib/stores/index.svelte';
	import { formatCurrency } from '$lib/format';
	import { savingsIcon } from '$lib/ui/icons';
	import IconPicker from '$lib/components/IconPicker.svelte';

	interface Props {
		lines: SavingsLineProgress[];
	}

	let { lines }: Props = $props();

	/** Id of the line being edited inline (null = none). */
	let editingId = $state<string | null>(null);
	let draftName = $state('');
	let draftAmount = $state(0);
	let draftIcon = $state('PiggyBank');

	function startEdit(line: SavingsLineProgress) {
		editingId = line.line.id;
		draftName = line.line.name;
		draftAmount = line.line.amountMil;
		draftIcon = line.line.icon;
	}

	function cancelEdit() {
		editingId = null;
	}

	function commitEdit() {
		if (!editingId) return;
		const name = draftName.trim();
		if (!name) return;
		savingsStore.updateLine(editingId, {
			name,
			icon: draftIcon,
			amountMil: draftAmount
		});
		editingId = null;
	}

	function remove(id: string, name: string) {
		if (confirm(`¿Eliminar la línea de ahorro "${name}"?`)) {
			savingsStore.removeLine(id);
		}
	}

	function pct(acumulado: number, meta: number): number {
		return meta > 0 ? Math.min(100, Math.round((acumulado / meta) * 100)) : 0;
	}
</script>

<div class="space-y-3">
	{#each lines as item (item.line.id)}
		{@const Icon = savingsIcon(item.line.icon)}
		{@const editing = editingId === item.line.id}
		<div class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
			{#if editing}
				<div class="space-y-3">
					<div class="flex flex-wrap items-center gap-3">
						<Icon class="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
						<input
							type="text"
							aria-label="Nombre"
							bind:value={draftName}
							placeholder="Nombre"
							class="min-w-40 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
						/>
						<div class="flex items-center gap-2">
							<input
								type="number"
								min="0"
								step="1"
								aria-label="Monto mensual (mil ₡)"
								bind:value={draftAmount}
								class="w-28 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
							/>
							<span class="text-xs text-gray-500 dark:text-gray-400">mil ₡</span>
						</div>
					</div>
					<IconPicker value={draftIcon} onselect={(name) => (draftIcon = name)} />
					<div class="flex items-center justify-end gap-2">
						<button
							type="button"
							onclick={cancelEdit}
							class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
						>
							Cancelar
						</button>
						<button
							type="button"
							onclick={commitEdit}
							disabled={!draftName.trim()}
							class="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
						>
							Guardar
						</button>
					</div>
				</div>
			{:else}
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="flex min-w-0 items-center gap-3">
						<span
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<Icon class="h-5 w-5" aria-hidden="true" />
						</span>
						<div class="min-w-0">
							<p class="truncate font-semibold text-gray-900 dark:text-gray-100">
								{item.line.name}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{formatCurrency(item.aporte)} / mes · meta {formatCurrency(item.metaEOY)}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<div class="text-right">
							<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Acumulado</p>
							<p class="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
								{formatCurrency(item.acumulado)}
							</p>
						</div>
						<button
							type="button"
							onclick={() => startEdit(item)}
							class="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
						>
							Editar
						</button>
						<button
							type="button"
							onclick={() => remove(item.line.id, item.line.name)}
							class="rounded-md px-2 py-1 text-xs font-medium text-gray-400 hover:text-red-600 dark:hover:text-red-400"
						>
							Eliminar
						</button>
					</div>
				</div>
				<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
					<div
						class="h-full rounded-full bg-primary"
						style="width: {pct(item.acumulado, item.metaEOY)}%"
					></div>
				</div>
			{/if}
		</div>
	{/each}
</div>
