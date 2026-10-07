<script lang="ts">
	import { onMount } from 'svelte';
	import * as echarts from 'echarts/core';
	import { BarChart, LineChart } from 'echarts/charts';
	import {
		GridComponent,
		TooltipComponent,
		LegendComponent,
		MarkLineComponent,
		MarkAreaComponent
	} from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import type { EChartsCoreOption, ECharts } from 'echarts/core';

	// Tree-shaken registration: only the pieces this app actually renders.
	echarts.use([
		BarChart,
		LineChart,
		GridComponent,
		TooltipComponent,
		LegendComponent,
		MarkLineComponent,
		MarkAreaComponent,
		CanvasRenderer
	]);

	interface Props {
		/** A complete ECharts option object. Re-applied whenever it changes. */
		option: EChartsCoreOption;
		/** Height of the chart canvas in pixels. */
		height?: number;
	}

	let { option, height = 320 }: Props = $props();

	let el = $state<HTMLDivElement | null>(null);
	let chart: ECharts | null = null;

	onMount(() => {
		if (!el) return;

		chart = echarts.init(el);
		chart.setOption(option);

		const observer = new ResizeObserver(() => chart?.resize());
		observer.observe(el);

		return () => {
			observer.disconnect();
			chart?.dispose();
			chart = null;
		};
	});

	// Re-render whenever the option object changes (month range, limit, …).
	$effect(() => {
		const next = option;
		chart?.setOption(next, true);
	});
</script>

<div bind:this={el} style="height: {height}px" class="w-full"></div>
