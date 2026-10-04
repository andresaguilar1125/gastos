<script lang="ts">
	import { init, use } from 'echarts/core';
	import { BarChart } from 'echarts/charts';
	import { GridComponent, TooltipComponent } from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import { Chart } from 'svelte-echarts';
	import type { EChartsOption } from 'echarts';
	import type { Budgets } from '$lib/config';
	import type { CategoryAggregate } from '$lib/types';
	import { CATEGORY_COLORS } from '$lib/config';

	use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

	interface Props {
		data: CategoryAggregate[];
		budgets: Budgets;
	}

	let { data, budgets }: Props = $props();

	let options = $derived<EChartsOption>({
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			formatter: (params: unknown) => {
				const p = (Array.isArray(params) ? params : [params]) as Array<{
					name: string;
					value: number;
				}>;
				const name = p[0]?.name ?? '';
				const budget = budgets[name];
				const min = budget?.min ?? 0;
				const max = budget?.max ?? 0;
				return `${name}<br/>Gasto: ₡${p[0]?.value.toLocaleString('es-CR')}<br/>Min: ₡${min.toLocaleString('es-CR')} · Max: ₡${max.toLocaleString('es-CR')}`;
			}
		},
		grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
		xAxis: { type: 'value', axisLabel: { formatter: (v: number) => `₡${v}` } },
		yAxis: {
			type: 'category',
			data: data.map((d) => d.categoria),
			inverse: true
		},
		series: data.map((d) => {
			const budget = budgets[d.categoria];
			const max = budget?.max ?? d.sum;
			const color = CATEGORY_COLORS[d.categoria as keyof typeof CATEGORY_COLORS] ?? '#888';
			return {
				name: d.categoria,
				type: 'bar',
				stack: 'total',
				data: data.map((other) => (other.categoria === d.categoria ? d.sum : 0)),
				itemStyle: { color },
				markLine: budget
					? {
							data: [
								{ xAxis: budget.min, name: 'min', lineStyle: { type: 'dashed', color: '#0f9d58' } },
								{ xAxis: budget.max, name: 'max', lineStyle: { type: 'dashed', color: '#db4437' } }
							]
						}
					: undefined
			};
		})
	});
</script>

<Chart {init} {options} style="width: 100%; height: 100%;" />
