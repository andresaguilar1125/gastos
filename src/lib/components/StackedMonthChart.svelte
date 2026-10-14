<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import { readableText } from '$lib/ui/colors.svelte';
	import { ACCENT_4, ACCENT_5, DANGER } from '$lib/ui/palettes';
	import EChart from '$lib/components/EChart.svelte';

	interface Point {
		/** Short month token ("Jun"). */
		mes: string;
		/** Sum per series label. */
		totals: Record<string, number>;
	}

	interface Group {
		label: string;
		color: string;
	}

	interface Props {
		/** Per-month totals, ascending by month. */
		points: Point[];
		/** Chart series in legend order. */
		groups: Group[];
		/** Monthly limit reference line, in thousands of colones. 0 hides it. */
		limitMil?: number;
		height?: number;
		/** Minimum canvas width; the chart scrolls horizontally below it. */
		minWidth?: number;
		/** Minimum segment value (mil ₡) that still shows an in-bar label. */
		labelMinMil?: number;
		emptyLabel?: string;
		/** Draw horizontal bars (months down the y-axis) instead of vertical. */
		horizontal?: boolean;
	}

	let {
		points,
		groups,
		limitMil = 0,
		height = 340,
		minWidth = 560,
		labelMinMil = 20,
		emptyLabel = 'Sin compras en este periodo.',
		horizontal = false
	}: Props = $props();

	/** One tooltip row: the series' month total. */
	type TooltipRow = { seriesName: string; value: number; dataIndex: number };

	/** Stacked bars (one per series) + the optional limit line. */
	const chartOption = $derived.by(() => {
		const labels = points.map((point) => point.mes);

		const bars = groups.map((group) => ({
			name: group.label,
			type: 'bar',
			stack: 'total',
			barMaxWidth: 34,
			itemStyle: { color: group.color },
			emphasis: { focus: 'series' },
			label: {
				show: true,
				position: 'inside',
				fontSize: 9,
				fontWeight: 'bold',
				color: readableText(group.color)
			},
			data: points.map((point) => {
				const value = Math.round((point.totals[group.label] ?? 0) / 1000);
				return { value, label: { show: value >= labelMinMil } };
			})
		}));

		/** Monthly limit reference line only (edited in Configuración). */
		const limitSeries = {
			name: 'Límite',
			type: 'line',
			silent: true,
			symbol: 'none',
			data: [],
			lineStyle: { width: 0 },
			markLine: {
				silent: true,
				symbol: 'none',
				lineStyle: { color: DANGER, type: 'dashed', width: 1.5 },
				label: { show: false },
				data: [horizontal ? { xAxis: limitMil } : { yAxis: limitMil }]
			}
		};

		const categoryAxis = {
			type: 'category',
			data: labels,
			axisTick: { show: false },
			axisLine: { lineStyle: { color: ACCENT_4 } }
		};
		const valueAxis = {
			type: 'value',
			axisLabel: { fontSize: 11, formatter: (value: number) => value.toLocaleString('de-DE') },
			splitLine: { lineStyle: { color: `${ACCENT_5}40` } }
		};

		return {
			grid: { left: 6, right: 18, top: 16, bottom: 44, containLabel: true },
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				formatter: (params: unknown) => {
					const rows = params as TooltipRow[];
					if (!rows.length) return '';
					const month = labels[rows[0].dataIndex] ?? '';
					const totals = new Map<string, number>();
					for (const row of rows) {
						totals.set(row.seriesName, (totals.get(row.seriesName) ?? 0) + Number(row.value));
					}
					const lines = groups.map(
						(group) => `
						<div style="display:flex;align-items:center;gap:6px">
							<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${group.color}"></span>
							<span>${group.label}</span>
							<span style="margin-left:auto;font-weight:600">${formatCurrency(
								(totals.get(group.label) ?? 0) * 1000
							)}</span>
						</div>`
					);
					return `<div style="font-weight:600;margin-bottom:4px">${month}</div>${lines.join('')}`;
				}
			},
			labelLayout: { hideOverlap: true },
			legend: {
				type: 'scroll',
				bottom: 0,
				icon: 'roundRect',
				itemWidth: 10,
				itemHeight: 10,
				textStyle: { fontSize: 11 },
				data: groups.map((group) => ({ name: group.label, itemStyle: { color: group.color } }))
			},
			xAxis: horizontal ? valueAxis : categoryAxis,
			yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
			series: limitMil > 0 ? [...bars, limitSeries] : bars
		};
	});
</script>

{#if points.length === 0}
	<p class="text-sm text-accent-4">{emptyLabel}</p>
{:else}
	<EChart option={chartOption} {height} {minWidth} />
{/if}
