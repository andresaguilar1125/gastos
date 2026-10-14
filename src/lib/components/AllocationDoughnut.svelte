<script lang="ts">
	import { CATEGORIES } from '$lib/config';
	import { formatCurrency } from '$lib/format';
	import { categoryColor } from '$lib/ui/colors.svelte';
	import { PRIMARY, ACCENT_4 } from '$lib/ui/palettes';
	import EChart from '$lib/components/EChart.svelte';

	interface Props {
		/** Current-month spend per category, in CRC. Missing categories read 0. */
		totals: Record<string, number>;
		/** Fixed monthly savings contribution, in CRC. */
		ahorro: number;
		/** Monthly income, in CRC. */
		ingreso: number;
		height?: number;
	}

	let { totals, ahorro, ingreso, height = 320 }: Props = $props();

	const RESTANTE_COLOR = ACCENT_4;

	/** Slices as positive amounts; Restante = income − spend − savings. */
	const slices = $derived.by(() => {
		const items: { name: string; value: number; color: string }[] = [...CATEGORIES].map(
			(categoria) => ({
				name: categoria,
				value: totals[categoria] ?? 0,
				color: categoryColor(categoria)
			})
		);
		if (ahorro > 0) items.push({ name: 'Ahorros', value: ahorro, color: PRIMARY });
		const restante = ingreso - items.reduce((sum, item) => sum + item.value, 0);
		if (restante > 0) items.push({ name: 'Restante', value: restante, color: RESTANTE_COLOR });
		return items.filter((item) => item.value > 0);
	});

	type TooltipRow = { name: string; value: number; percent: number; color: string };

	const chartOption = $derived.by(() => ({
		tooltip: {
			trigger: 'item',
			formatter: (params: unknown) => {
				const row = params as TooltipRow;
				return `<div style="font-weight:600;margin-bottom:2px">${row.name}</div>
					<div>${formatCurrency(Number(row.value))} · ${Number(row.percent).toFixed(1)}%</div>`;
			}
		},
		legend: {
			type: 'scroll',
			bottom: 0,
			icon: 'roundRect',
			itemWidth: 10,
			itemHeight: 10,
			textStyle: { fontSize: 11 }
		},
		series: [
			{
				type: 'pie',
				radius: ['45%', '70%'],
				center: ['50%', '46%'],
				avoidLabelOverlap: true,
				itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
				label: {
					formatter: (params: { name: string; percent: number }) =>
						`${params.name}\n${Number(params.percent).toFixed(1)}%`,
					fontSize: 11,
					lineHeight: 14
				},
				labelLine: { length: 8, length2: 8 },
				emphasis: { scale: true, scaleSize: 6 },
				data: slices.map((slice) => ({
					name: slice.name,
					value: slice.value,
					itemStyle: { color: slice.color }
				}))
			}
		]
	}));
</script>

{#if ingreso <= 0 || slices.length === 0}
	<p class="text-sm text-accent-4">
		Configura el <strong>ingreso mensual</strong> en Configuración para ver la distribución.
	</p>
{:else}
	<EChart option={chartOption} {height} />
{/if}
