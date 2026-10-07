<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryDetail from '$lib/components/CategoryDetail.svelte';

	setPageTitle('Extras');
</script>

<svelte:head>
	<title>Extras | Gastos</title>
</svelte:head>

<CategoryDetail categoria="Extras" breakdown="comercio" />
