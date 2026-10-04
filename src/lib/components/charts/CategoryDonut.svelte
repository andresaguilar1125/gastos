<script lang="ts">
	import { init, use } from 'echarts/core';
	import { PieChart } from 'echarts/charts';
	import { TooltipComponent, LegendComponent } from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import { Chart } from 'svelte-echarts';
	import { CATEGORY_COLORS } from '$lib/config';
	import type { CategoryAggregate } from '$lib/types';

	use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

	interface Props {
		data: CategoryAggregate[];
	}

	let { data }: Props = $props();

	let option = $derived({
		tooltip: { trigger: 'item', formatter: '{b}: ₡{c} ({d}%)' },
		legend: { bottom: 0 },
		color: data.map((d) => CATEGORY_COLORS[d.categoria as keyof typeof CATEGORY_COLORS] ?? '#888'),
		series: [
			{
				name: 'Categoría',
				type: 'pie',
				radius: ['40%', '70%'],
				avoidLabelOverlap: true,
				itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
				label: { show: true, formatter: '{b}\n{d}%' },
				data: data.map((d) => ({ value: d.sum, name: d.categoria }))
			}
		]
	});
</script>

<Chart {init} {option} style="width: 100%; height: 100%;" />
