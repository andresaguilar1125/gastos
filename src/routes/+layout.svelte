<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/ui/theme';
	import { dataStore, hydrateStores } from '$lib/stores/index.svelte';
	import TopNav from '$lib/components/TopNav.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let innerWidth = $state(0);

	// Reactively reflect the theme onto <html> for the `dark:` variants.
	$effect(() => {
		const dark = $theme === 'dark';
		document.documentElement.classList.toggle('dark', dark);
		document.documentElement.classList.toggle('light', !dark);
	});

	onMount(() => {
		hydrateStores();
		theme.apply($theme);
		dataStore.load();
	});
</script>

<svelte:window bind:innerWidth />

<div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
	<TopNav />

	<main class="flex-1 px-4 pb-28 pt-4 md:pb-8 md:pt-6">
		{@render children()}
	</main>

	{#if innerWidth < 768}
		<BottomNav />
	{/if}
</div>
