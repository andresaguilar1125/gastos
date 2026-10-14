<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryBreakdownPage from '$lib/components/CategoryBreakdownPage.svelte';

	setPageTitle('Comida');
</script>

<svelte:head>
	<title>Comida | Gastos</title>
</svelte:head>

<CategoryBreakdownPage
	categoria="Comida"
	dimension="persona"
	labelHeader="Persona"
	deltaTitle="Delta-Comida"
	compareTitle="Categorias-Comida"
	compare={{ positive: 'Salidas', negative: 'Express' }}
	horizontal
	showStats
	statsTitle="Producto-Comida"
	countHeader="Compras"
	dataTitle="Data-Comida"
/>
