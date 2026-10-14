<script lang="ts">
	import { setPageTitle } from '$lib/ui/theme';
	import CategoryBreakdownPage from '$lib/components/CategoryBreakdownPage.svelte';

	setPageTitle('Viajes');
</script>

<svelte:head>
	<title>Viajes | Gastos</title>
</svelte:head>

<CategoryBreakdownPage
	categoria="Viajes"
	dimension="persona"
	labelHeader="Persona"
	deltaTitle="Delta-Viajes"
	compareTitle="Categorias-Viajes"
	horizontal
	compare={{
		positive: { label: 'Mari', members: ['Mari', 'Medico'] },
		negative: { label: 'Andrés', members: ['Salidas', 'Trabajo', 'Andrés'] }
	}}
	showStats
	statsTitle="Personas-Viajes"
	countHeader="Viajes"
	dataTitle="Data-Viajes"
/>
