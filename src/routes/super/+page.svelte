<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryBreakdownPage from '$lib/components/CategoryBreakdownPage.svelte';

	setPageTitle('Super');
</script>

<svelte:head>
	<title>Super | Gastos</title>
</svelte:head>

<CategoryBreakdownPage
	categoria="Super"
	dimension="persona"
	chartDimension="semana"
	labelHeader="Persona"
	deltaTitle="Delta-Super"
	horizontal
	groupHistory
	showStats
	statsTitle="Categorias-Super"
	countHeader="Compras"
	dataTitle="Data-Super"
/>
