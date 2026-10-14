<script lang="ts">
	import { onMount } from 'svelte';
	import * as echarts from 'echarts/core';
	import { BarChart, LineChart, PieChart } from 'echarts/charts';
	import {
		GridComponent,
		TooltipComponent,
		LegendComponent,
		MarkLineComponent,
		MarkAreaComponent
	} from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import { LabelLayout } from 'echarts/features';
	import type { EChartsCoreOption, ECharts } from 'echarts/core';

	// Tree-shaken registration: only the pieces this app actually renders.
	echarts.use([
		BarChart,
		LineChart,
		PieChart,
		GridComponent,
		TooltipComponent,
		LegendComponent,
		MarkLineComponent,
		MarkAreaComponent,
		LabelLayout,
		CanvasRenderer
	]);

	interface Props {
		/** A complete ECharts option object. Re-applied whenever it changes. */
		option: EChartsCoreOption;
		/** Height of the chart canvas in pixels. */
		height?: number;
		/**
		 * Minimum canvas width in pixels. When the container is narrower than
		 * this, the chart grows to `minWidth` and scrolls horizontally instead of
		 * squashing its bars — keeps the Viajes chart readable on small screens.
		 * `0` (default) lets the chart shrink to the container width.
		 */
		minWidth?: number;
	}

	let { option, height = 320, minWidth = 0 }: Props = $props();

	let wrapper = $state<HTMLDivElement | null>(null);
	let el = $state<HTMLDivElement | null>(null);
	let chart: ECharts | null = null;

	onMount(() => {
		if (!el) return;

		chart = echarts.init(el);
		chart.setOption(option);

		/* Observe the scroll container so the canvas follows the viewport width. */
		const observer = new ResizeObserver(() => chart?.resize());
		observer.observe(wrapper ?? el);

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

<div bind:this={wrapper} class="w-full overflow-x-auto">
	<div
		bind:this={el}
		class="w-full"
		style="height: {height}px{minWidth ? `; min-width: ${minWidth}px` : ''}"
	></div>
</div>
