<script lang="ts">
	import { TrendingUp, TrendingDown, Minus } from '@lucide/svelte';
	import type { MomDelta } from '$lib/types';

	interface Props {
		delta: MomDelta;
		label?: string;
		/** When true, an increase is bad (spending) and shown in red. */
		invert?: boolean;
		size?: 'sm' | 'md';
	}

	let { delta, label = 'vs mes anterior', invert = true, size = 'sm' }: Props = $props();

	const tone = $derived.by(() => {
		if (!delta.hasPrevious || delta.direction === 'flat') return 'neutral';
		const isBad = invert ? delta.direction === 'up' : delta.direction === 'down';
		return isBad ? 'bad' : 'good';
	});

	const classes = $derived.by(() => {
		const base =
			size === 'md' ? 'gap-1.5 px-2.5 py-1 text-sm' : 'gap-1 px-2 py-0.5 text-xs';
		const tones: Record<string, string> = {
			good: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
			bad: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
			neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
		};
		return `${base} ${tones[tone]}`;
	});

	const display = $derived(
		delta.hasPrevious ? `${delta.pct > 0 ? '+' : ''}${delta.pct}%` : '—'
	);
</script>

<span class="inline-flex items-center rounded-full font-semibold {classes}">
	{#if !delta.hasPrevious || delta.direction === 'flat'}
		<Minus class={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
	{:else if delta.direction === 'up'}
		<TrendingUp class={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
	{:else}
		<TrendingDown class={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
	{/if}
	<span>{display}</span>
	{#if label}
		<span class="font-normal opacity-80">{label}</span>
	{/if}
</span>
