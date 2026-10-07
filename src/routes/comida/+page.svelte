<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryDetail from '$lib/components/CategoryDetail.svelte';

	setPageTitle('Comida');
</script>

<svelte:head>
	<title>Comida | Gastos</title>
</svelte:head>

<CategoryDetail categoria="Comida" breakdown="comercio" />
