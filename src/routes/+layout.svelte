<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { dataStore, hydrateStores } from '$lib/stores/index.svelte';
	import TopNav from '$lib/components/TopNav.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let innerWidth = $state(0);

	onMount(() => {
		hydrateStores();
		dataStore.load();

		// Register the generated service worker (production only; best-effort).
		if (import.meta.env.PROD && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {
				/* offline/PWA is optional */
			});
		}
	});
</script>

<svelte:window bind:innerWidth />

<div class="flex min-h-screen flex-col bg-accent-6">
	<TopNav />

	<main class="flex-1 px-4 pb-28 pt-4 md:pb-8 md:pt-6">
		{@render children()}
	</main>

	{#if innerWidth < 768}
		<BottomNav />
	{/if}
</div>
