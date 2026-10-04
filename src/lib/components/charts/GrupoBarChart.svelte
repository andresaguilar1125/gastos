<script lang="ts">
	import { init, use } from 'echarts/core';
	import { BarChart } from 'echarts/charts';
	import { GridComponent, TooltipComponent } from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import { Chart } from 'svelte-echarts';
	import type { GrupoAggregate } from '$lib/types';

	use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

	interface Props {
		data: GrupoAggregate[];
	}

	let { data }: Props = $props();

	let option = $derived({
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
		xAxis: { type: 'value', axisLabel: { formatter: (v: number) => `₡${v}` } },
		yAxis: { type: 'category', data: data.map((d) => d.grupo), inverse: true },
		series: [
			{
				type: 'bar',
				data: data.map((d, i) => ({
					value: d.sum,
					itemStyle: {
						color: i < 3 ? '#f9ab00' : '#94a3b8'
					}
				}))
			}
		]
	});
</script>

<Chart {init} {option} style="width: 100%; height: 100%;" />
