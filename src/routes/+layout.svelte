<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { dataStore, hydrateStores } from '$lib/stores/index.svelte';
	import TopNav from '$lib/components/TopNav.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let innerWidth = $state(0);

	onMount(() => {
		hydrateStores();
		dataStore.load();
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
