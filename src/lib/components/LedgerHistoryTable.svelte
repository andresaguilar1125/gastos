<script lang="ts">
	import type { NormalizedRow } from '$lib/types';
	import { formatCurrency } from '$lib/format';
	import { formatYearMonth } from '$lib/data/aggregates';
	import { datetimeKey } from '$lib/data/normalize';
	import { Search, ChevronDown } from '@lucide/svelte';

	interface Props {
		/** Every row of the (already month-filtered) dataset. */
		rows: NormalizedRow[];
		/** Header for the grouping column ("Persona" / "Comercio"). */
		labelHeader?: string;
		/** Renders the grouping value for a row (defaults to its persona label). */
		labelValue?: (row: NormalizedRow) => string;
		/** Shown when there are no rows (plural noun differs per page). */
		emptyLabel?: string;
		/** Month expanded by default (usually the reference month). */
		refMonth?: string | null;
	}

	let {
		rows,
		labelHeader = 'Persona',
		labelValue = (row) => row.personaLabel,
		emptyLabel = 'Sin viajes registrados.',
		refMonth = null
	}: Props = $props();

	/** Free-text filter typed in the search box. */
	let query = $state('');

	/** Per-month open/closed overrides chosen by the user. */
	let overrides = $state<Record<string, boolean>>({});

	const needle = $derived(query.trim().toLowerCase());

	/** Newest entries first, strictly by datetime Z→A (`periodo`/`fecha` tiebreak). */
	const ordered = $derived(
		[...rows].sort((a, b) => {
			const keyA = datetimeKey(a.fecha);
			const keyB = datetimeKey(b.fecha);
			if (keyA !== keyB) return keyA < keyB ? 1 : -1;
			if (a.periodo !== b.periodo) return a.periodo < b.periodo ? 1 : -1;
			return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0;
		})
	);

	/** Searchable text for a row, covering every column shown. */
	function haystack(row: NormalizedRow): string {
		return [
			row.fecha,
			labelValue(row),
			row.comercio,
			row.descripcion,
			String(row.monto),
			formatCurrency(row.monto)
		]
			.join(' ')
			.toLowerCase();
	}

	/** Query-filtered rows, grouped per month with the newest month first. */
	const groups = $derived.by(() => {
		const filtered = needle ? ordered.filter((row) => haystack(row).includes(needle)) : ordered;

		const buckets = new Map<string, NormalizedRow[]>();
		for (const row of filtered) {
			const bucket = buckets.get(row.yearMonth);
			if (bucket) bucket.push(row);
			else buckets.set(row.yearMonth, [row]);
		}

		return [...buckets.entries()]
			.sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
			.map(([yearMonth, monthRows]) => ({
				yearMonth,
				rows: monthRows,
				sum: monthRows.reduce((total, row) => total + row.monto, 0)
			}));
	});

	const shownCount = $derived(groups.reduce((sum, group) => sum + group.rows.length, 0));

	/** Sum of every row currently shown (respects the active search filter). */
	const shownSum = $derived(groups.reduce((sum, group) => sum + group.sum, 0));

	/** Sticky offset for month headers: cleared below the top nav and card header. */
	const stickyTop = 'top-[calc(var(--topnav-h,0px)_+_var(--card-header-h,0px))]';

	/** A month is open when searching, otherwise per the user's override/default. */
	function isOpen(yearMonth: string): boolean {
		if (needle) return true;
		return yearMonth in overrides ? overrides[yearMonth] : yearMonth === refMonth;
	}

	function toggle(yearMonth: string): void {
		overrides = { ...overrides, [yearMonth]: !isOpen(yearMonth) };
	}
</script>

{#if ordered.length === 0}
	<p class="text-sm text-accent-4">{emptyLabel}</p>
{:else}
	<label class="relative mb-3 block">
		<Search
			class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-4/70"
			aria-hidden="true"
		/>
		<input
			type="search"
			bind:value={query}
			placeholder="Buscar…"
			aria-label="Buscar en la tabla"
			class="w-full rounded-lg border border-accent-4/30 bg-white py-1.5 pl-9 pr-3 text-sm text-accent-5 placeholder:text-accent-4/70 focus:border-accent-3 focus:outline-none"
		/>
	</label>

	{#if groups.length === 0}
		<p class="text-sm text-accent-4">Sin resultados para “{query}”.</p>
	{:else}
		<div class="hidden md:block">
			<table class="w-full border-separate border-spacing-0 text-sm">
				<thead>
					<tr class="text-left text-xs uppercase tracking-wide text-accent-4/70">
						<th class="border-b border-accent-4/20 py-2 pr-4 font-medium">
							Fecha
						</th>
						<th class="border-b border-accent-4/20 py-2 pr-4 font-medium">
							{labelHeader}
						</th>
						<th class="border-b border-accent-4/20 py-2 pr-4 font-medium">
							Comercio
						</th>
						<th class="border-b border-accent-4/20 py-2 pr-4 font-medium">
							Descripción
						</th>
						<th class="border-b border-accent-4/20 py-2 text-right font-medium">
							Monto
						</th>
					</tr>
				</thead>
				{#each groups as group, groupIndex (groupIndex)}
					<tbody>
						<tr>
							<td
								colspan="5"
								class="sticky {stickyTop} z-20 bg-accent-6 p-0 {groupIndex > 0
									? 'border-t-2 border-accent-3/20 '
									: ''}"
							>
								<button
									type="button"
									onclick={() => toggle(group.yearMonth)}
									disabled={needle.length > 0}
									aria-expanded={isOpen(group.yearMonth)}
									class="flex w-full items-center justify-between gap-3 px-1 py-2 text-left text-xs font-semibold uppercase tracking-wide text-accent-4 {needle
										? 'cursor-default'
										: 'hover:text-accent-5 '}"
								>
									<span class="flex min-w-0 items-center gap-1.5">
										<ChevronDown
											class="h-4 w-4 shrink-0 text-accent-3 transition-transform {isOpen(
												group.yearMonth
											)
												? ''
												: '-rotate-90'}"
											aria-hidden="true"
										/>
										<span class="truncate">
											{group.yearMonth ? formatYearMonth(group.yearMonth) : 'Sin mes'}
										</span>
									</span>
									<span class="flex shrink-0 items-center gap-2 tabular-nums">
										<span class="text-accent-4/70">CNT</span>
										<span>{group.rows.length}</span>
										<span class="text-accent-4/50">|</span>
										<span class="text-accent-4/70">SUM</span>
										<span>{formatCurrency(group.sum)}</span>
									</span>
								</button>
							</td>
						</tr>
						{#if isOpen(group.yearMonth)}
							{#each group.rows as row, i (i)}
								<tr>
									<td
										class="whitespace-nowrap border-b border-accent-4/10 py-2 pr-4 text-accent-4"
									>
										{row.fecha}
									</td>
									<td
										class="border-b border-accent-4/10 py-2 pr-4 font-medium text-accent-5"
									>
										{labelValue(row)}
									</td>
									<td
										class="border-b border-accent-4/10 py-2 pr-4 text-accent-4"
									>
										{row.comercio}
									</td>
									<td
										class="border-b border-accent-4/10 py-2 pr-4 text-accent-4"
									>
										{row.descripcion}
									</td>
									<td
										class="border-b border-accent-4/10 py-2 text-right tabular-nums text-accent-5"
									>
										{formatCurrency(row.monto)}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				{/each}
			</table>
		</div>

		<div class="space-y-3 md:hidden">
			{#each groups as group, groupIndex (groupIndex)}
				<div>
					<button
						type="button"
						onclick={() => toggle(group.yearMonth)}
						disabled={needle.length > 0}
						aria-expanded={isOpen(group.yearMonth)}
						class="sticky {stickyTop} z-20 flex w-full items-center justify-between gap-3 border-b border-accent-4/20 bg-white py-2 text-left text-xs font-semibold uppercase tracking-wide text-accent-4 {needle
							? 'cursor-default'
							: 'hover:text-accent-5 '}"
					>
						<span class="flex min-w-0 items-center gap-1.5">
							<ChevronDown
								class="h-4 w-4 shrink-0 text-accent-3 transition-transform {isOpen(group.yearMonth)
									? ''
									: '-rotate-90'}"
								aria-hidden="true"
							/>
							<span class="truncate">
								{group.yearMonth ? formatYearMonth(group.yearMonth) : 'Sin mes'}
							</span>
						</span>
						<span class="flex shrink-0 items-center gap-2 tabular-nums">
							<span class="text-accent-4/70">CNT</span>
							<span>{group.rows.length}</span>
							<span class="text-accent-4/50">|</span>
							<span class="text-accent-4/70">SUM</span>
							<span>{formatCurrency(group.sum)}</span>
						</span>
					</button>

					{#if isOpen(group.yearMonth)}
						<div class="mt-2 space-y-2">
							{#each group.rows as row, i (i)}
								<div class="rounded-lg border border-accent-4/20 p-3">
									<div class="flex items-center justify-between gap-3">
										<div class="min-w-0">
											<p class="text-sm text-accent-3">{row.fecha}</p>
											<p class="mt-0.5 truncate text-xs text-accent-4">
												{labelValue(row)} • {row.comercio} • {row.descripcion}
											</p>
										</div>
										<p class="shrink-0 text-sm tabular-nums text-accent-5">
											{formatCurrency(row.monto)}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<p
			class="mt-3 flex items-center justify-end gap-2 text-xs tabular-nums text-accent-4/70"
		>
			<span class="uppercase">CNT</span>
			<span class="text-accent-5">{shownCount}</span>
			<span class="text-accent-4/50">|</span>
			<span class="uppercase">SUM</span>
			<span class="text-accent-5">{formatCurrency(shownSum)}</span>
		</p>
	{/if}
{/if}
