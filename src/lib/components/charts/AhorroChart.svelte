<script lang="ts">
	import { init, use } from 'echarts/core';
	import { LineChart } from 'echarts/charts';
	import { GridComponent, TooltipComponent } from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import { Chart } from 'svelte-echarts';
	import type { NormalizedRow } from '$lib/types';

	use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

	interface Props {
		rows: NormalizedRow[];
	}

	let { rows }: Props = $props();

	let option = $derived(() => {
		const ahorroRows = rows
			.filter((r) => r.categoria.toLowerCase() === 'ahorro')
			.sort((a, b) => a.fecha.localeCompare(b.fecha));
		const cumulative: number[] = [];
		let acc = 0;
		const dates: string[] = [];
		for (const r of ahorroRows) {
			acc += r.monto;
			cumulative.push(acc);
			dates.push(r.fecha || `#${cumulative.length}`);
		}

		return {
			tooltip: { trigger: 'axis', formatter: '{b}<br/>Ahorro: ₡{c}' },
			grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
			xAxis: { type: 'category', data: dates, boundaryGap: false },
			yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `₡${v}` } },
			series: [
				{
					name: 'Ahorro acumulado',
					type: 'line',
					data: cumulative,
					smooth: true,
					areaStyle: { color: 'rgba(219,68,55,0.2)' },
					itemStyle: { color: '#db4437' },
					lineStyle: { color: '#db4437', width: 3 }
				}
			]
		};
	});
</script>

<Chart {init} option={option()} style="width: 100%; height: 100%;" />
