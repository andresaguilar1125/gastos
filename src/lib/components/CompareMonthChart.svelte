<script lang="ts">
	import { formatCurrency } from '$lib/format';
	import { labelColor, readableText, normalizeLabel } from '$lib/ui/colors.svelte';
	import { ACCENT_4, ACCENT_5 } from '$lib/ui/palettes';
	import type { CompareGroup } from '$lib/types';
	import EChart from '$lib/components/EChart.svelte';

	interface Point {
		/** Short month token ("Jun"). */
		mes: string;
		/** Sum per series label. */
		totals: Record<string, number>;
	}

	interface Props {
		/** Per-month totals, ascending by month. */
		points: Point[];
		/** Right side (positive values) — a label or a named group. */
		positive: CompareGroup;
		/** Left side (negative values) — a label or a named group. */
		negative: CompareGroup;
		/** Explicit accent colour for the positive side; defaults to `labelColor`. */
		positiveColor?: string;
		/** Explicit accent colour for the negative side; defaults to `labelColor`. */
		negativeColor?: string;
		height?: number;
		/** Minimum canvas width; the chart scrolls horizontally below it. */
		minWidth?: number;
		/** Minimum bar value (mil ₡) that still shows an in-bar label. */
		labelMinMil?: number;
		emptyLabel?: string;
		/** Mirror left/right (months down the y-axis) instead of up/down. */
		horizontal?: boolean;
	}

	let {
		points,
		positive,
		negative,
		positiveColor = undefined,
		negativeColor = undefined,
		height = 340,
		minWidth = 560,
		labelMinMil = 20,
		emptyLabel = 'Sin compras en este periodo.',
		horizontal = false
	}: Props = $props();

	/** A group with its members, display label and resolved colour. */
	interface ResolvedGroup {
		label: string;
		members: string[];
		color: string;
	}

	/** Resolve a plain label or a `{ label, members }` group to its palette colour. */
	function resolve(group: CompareGroup, color: string | undefined): ResolvedGroup {
		const label = typeof group === 'string' ? group : group.label;
		const members = typeof group === 'string' ? [group] : group.members;
		return { label, members, color: color ?? labelColor(label) };
	}

	const posGroup = $derived(resolve(positive, positiveColor));
	const negGroup = $derived(resolve(negative, negativeColor));

	/** Case/accent-insensitive per-month sum of a group's members. */
	function sumMembers(totals: Record<string, number>, members: string[]): number {
		const wanted = new Set(members.map(normalizeLabel));
		let sum = 0;
		for (const [label, value] of Object.entries(totals)) {
			if (wanted.has(normalizeLabel(label))) sum += value;
		}
		return sum;
	}

	/** True when either side has any value in the window. */
	const hasData = $derived(
		points.some(
			(point) =>
				sumMembers(point.totals, posGroup.members) > 0 ||
				sumMembers(point.totals, negGroup.members) > 0
		)
	);

	/** One tooltip row: the series' month total. */
	type TooltipRow = { seriesName: string; value: number; dataIndex: number };

	/** Two mirrored bar series sharing one column, plus the axis tooltip. */
	const chartOption = $derived.by(() => {
		const labels = points.map((point) => point.mes);

		/** `sign` puts the series on the negative side; labels always read absolute. */
		function bar(group: ResolvedGroup, sign: 1 | -1) {
			return {
				name: group.label,
				type: 'bar',
				stack: 'compare',
				barMaxWidth: 34,
				itemStyle: { color: group.color },
				emphasis: { focus: 'series' },
				label: {
					show: true,
					position: 'inside',
					fontSize: 9,
					fontWeight: 'bold',
					color: readableText(group.color),
					formatter: (params: { value: number }) => String(Math.abs(params.value))
				},
				data: points.map((point) => {
					const value = Math.round(sumMembers(point.totals, group.members) / 1000) * sign;
					return { value, label: { show: Math.abs(value) >= labelMinMil } };
				})
			};
		}

		const categoryAxis = {
			type: 'category',
			data: labels,
			axisTick: { show: false },
			axisLine: { lineStyle: { color: ACCENT_4 } }
		};
		const valueAxis = {
			type: 'value',
			axisLabel: {
				fontSize: 11,
				formatter: (value: number) => Math.abs(value).toLocaleString('de-DE')
			},
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
					const lines = rows.map(
						(row) => `
						<div style="display:flex;align-items:center;gap:6px">
							<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${
								row.seriesName === posGroup.label ? posGroup.color : negGroup.color
							}"></span>
							<span>${row.seriesName}</span>
							<span style="margin-left:auto;font-weight:600">${formatCurrency(
								Math.abs(Number(row.value)) * 1000
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
				data: [
					{ name: posGroup.label, itemStyle: { color: posGroup.color } },
					{ name: negGroup.label, itemStyle: { color: negGroup.color } }
				]
			},
			xAxis: horizontal ? valueAxis : categoryAxis,
			yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
			series: [bar(posGroup, 1), bar(negGroup, -1)]
		};
	});
</script>

{#if !hasData}
	<p class="text-sm text-accent-4">{emptyLabel}</p>
{:else}
	<EChart option={chartOption} {height} {minWidth} />
{/if}
