<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryDetail from '$lib/components/CategoryDetail.svelte';

	setPageTitle('Medico');
</script>

<svelte:head>
	<title>Medico | Gastos</title>
</svelte:head>

<CategoryDetail
	categoria="Medico"
	descripcion="Gastos médicos: gasto volátil y esporádico, se visualiza tendencia y variación."
/>
