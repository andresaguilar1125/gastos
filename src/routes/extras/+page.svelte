<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryBreakdownPage from '$lib/components/CategoryBreakdownPage.svelte';

	setPageTitle('Extras');
</script>

<svelte:head>
	<title>Extras | Gastos</title>
</svelte:head>

<CategoryBreakdownPage
	categoria="Extras"
	dimension="persona"
	labelHeader="Persona"
	deltaTitle="Delta-Extras"
	compareTitle="Categorias-Extras"
	horizontal
	compare={{
		positive: { label: 'Mari', members: ['Mari'] },
		negative: { label: 'Andrés', members: ['Andrés'] }
	}}
	showStats
	statsTitle="Personas-Extras"
	countHeader="Compras"
	dataTitle="Data-Extras"
/>
