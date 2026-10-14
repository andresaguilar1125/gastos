<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryBreakdownPage from '$lib/components/CategoryBreakdownPage.svelte';

	setPageTitle('Recibos');
</script>

<svelte:head>
	<title>Recibos | Gastos</title>
</svelte:head>

<CategoryBreakdownPage
	categoria="Recibos"
	dimension="comercio"
	labelHeader="Comercio"
	deltaTitle="Delta-Recibos"
	horizontal
	showStats
	statsTitle="Comercio-Recibos"
	countHeader="Recibos"
	dataTitle="Data-Recibos"
/>
