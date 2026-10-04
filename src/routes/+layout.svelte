<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/ui/theme';
	import { dataStore } from '$lib/stores/index.svelte';
	import TopNav from '$lib/components/TopNav.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let innerWidth = $state(0);

	onMount(() => {
		theme.subscribe((v) => {
			document.documentElement.classList.toggle('dark', v === 'dark');
		})();
		dataStore.load();
	});

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', $theme === 'dark');
		}
	});
</script>

<svelte:window bind:innerWidth />

<div class="flex min-h-screen flex-col">
	<TopNav />

	<main class="flex-1 px-4 pb-24 pt-4 md:pb-6 md:pt-6">
		{@render children()}
	</main>

	{#if innerWidth < 768}
		<BottomNav />
	{/if}
</div>
