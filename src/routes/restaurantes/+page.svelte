<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryDetail from '$lib/components/CategoryDetail.svelte';

	setPageTitle('Restaurantes');
</script>

<svelte:head>
	<title>Restaurantes | Gastos</title>
</svelte:head>

<CategoryDetail
	categoria="Restaurantes"
	descripcion="Gastos en restaurantes, con objetivo de tope máximo de presupuesto."
/>
