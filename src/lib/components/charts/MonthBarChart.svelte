<script lang="ts">
	import { init, use } from 'echarts/core';
	import { BarChart, LineChart } from 'echarts/charts';
	import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import { Chart } from 'svelte-echarts';
	import type { EChartsOption } from 'echarts';
	import type { MonthAggregate } from '$lib/types';

	use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

	interface Props {
		data: MonthAggregate[];
		highlight?: string | null;
	}

	let { data, highlight = null }: Props = $props();

	let options = $derived<EChartsOption>({
		tooltip: {
			trigger: 'axis',
			formatter: (params: unknown) => {
				const p = (Array.isArray(params) ? params : [params]) as Array<{
					name: string;
					value: number;
				}>;
				return `${p[0]?.name}: ₡${Number(p[0]?.value ?? 0).toLocaleString('es-CR')}`;
			}
		},
		grid: { left: '3%', right: '4%', bottom: 0, top: 16, containLabel: true },
		xAxis: { type: 'category', data: data.map((d) => d.mes) },
		yAxis: {
			type: 'value',
			axisLabel: {
				formatter: (v: number) =>
					v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
			}
		},
		series: [
			{
				name: 'Gasto mensual',
				type: 'bar',
				barMaxWidth: 42,
				itemStyle: {
					borderRadius: [6, 6, 0, 0],
					color: (params: { name: string }) =>
						params.name === highlight ? '#f97316' : '#fdba74'
				},
				data: data.map((d) => d.sum)
			},
			{
				name: 'Tendencia',
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 7,
				lineStyle: { color: '#ea580c', width: 2 },
				itemStyle: { color: '#ea580c' },
				data: data.map((d) => d.sum)
			}
		]
	});
</script>

<Chart {init} {options} style="width: 100%; height: 100%;" />
