<script lang="ts">
	import { SAVINGS_ICONS, SAVINGS_ICON_NAMES } from '$lib/ui/icons';

	interface Props {
		/** Currently selected icon name (Lucide export name). */
		value: string;
		onselect: (name: string) => void;
		/** Grid columns at the smallest breakpoint. */
		cols?: number;
	}

	let { value, onselect, cols = 8 }: Props = $props();
</script>

<div
	class="grid gap-1.5"
	style="grid-template-columns: repeat({cols}, minmax(0, 1fr));"
	role="radiogroup"
	aria-label="Icono"
>
	{#each SAVINGS_ICON_NAMES as name (name)}
		{@const Icon = SAVINGS_ICONS[name]}
		<button
			type="button"
			onclick={() => onselect(name)}
			role="radio"
			aria-checked={value === name}
			aria-label={name}
			title={name}
			class="flex h-9 items-center justify-center rounded-lg border transition-colors {value ===
			name
				? 'border-primary bg-primary/10 text-primary'
				: 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'}"
		>
			<Icon class="h-4 w-4" aria-hidden="true" />
		</button>
	{/each}
</div>
