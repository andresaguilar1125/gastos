<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryDetail from '$lib/components/CategoryDetail.svelte';

	setPageTitle('Recibos');
</script>

<svelte:head>
	<title>Recibos | Gastos</title>
</svelte:head>

<CategoryDetail categoria="Recibos" breakdown="comercio" />
