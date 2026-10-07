<script lang="ts">
	interface Props {
		/** Active window: 1 = current month, 3, 6, or 0 = all. */
		value: number;
		onchange: (value: number) => void;
		/** Optional custom labels; defaults to CM / 3M / 6M / ALL. */
		options?: { value: number; label: string }[];
	}

	let {
		value,
		onchange,
		options = [
			{ value: 1, label: 'CM' },
			{ value: 3, label: '3M' },
			{ value: 6, label: '6M' },
			{ value: 0, label: 'ALL' }
		]
	}: Props = $props();
</script>

<div
	class="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700"
	role="group"
	aria-label="Rango de meses"
>
	{#each options as opt (opt.value)}
		<button
			type="button"
			onclick={() => onchange(opt.value)}
			aria-pressed={value === opt.value}
			class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors {value === opt.value
				? 'bg-primary text-white'
				: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'}"
		>
			{opt.label}
		</button>
	{/each}
</div>
