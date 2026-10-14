<script lang="ts">
	import type { PiggyBank } from '$lib/types';
	import { formatCurrency } from '$lib/format';
	import { readableText } from '$lib/ui/colors.svelte';
	import { ACCENT_4, ACCENT_5, DANGER } from '$lib/ui/palettes';
	import EChart from '$lib/components/EChart.svelte';

	interface Props {
		/** Every piggy bank, with `aporte` and `esteMes` already in CRC. */
		banks: PiggyBank[];
		height?: number;
		minWidth?: number;
	}

	let { banks, height = 320, minWidth = 0 }: Props = $props();

	/** Gastado uses the danger colour (deep blue), matching over-budget cues. */
	const GASTADO_COLOR = DANGER;
	const RESTANTE_COLOR = ACCENT_4;

	/** nk scale: thousands of colones, rounded up. */
	const nk = (value: number) => Math.ceil(value / 1000);

	type Point = {
		categoria: string;
		gastado: number;
		restante: number;
		aporte: number;
	};

	const points = $derived<Point[]>(
		banks.map((bank) => ({
			categoria: bank.categoria,
			gastado: nk(bank.esteMes),
			restante: nk(Math.max(0, bank.aporte - bank.esteMes)),
			aporte: nk(bank.aporte)
		}))
	);

	type TooltipRow = { seriesName: string; dataIndex: number };

	/** Horizontal mirrored (tornado) bars: one row per envelope. */
	const chartOption = $derived.by(() => {
		const labels = points.map((point) => point.categoria);

		const categoryAxis = {
			type: 'category',
			data: labels,
			axisTick: { show: false },
			axisLine: { lineStyle: { color: ACCENT_4 } },
			axisLabel: { fontSize: 11 }
		};
		const valueAxis = {
			type: 'value',
			axisLabel: {
				fontSize: 11,
				formatter: (value: number) => Math.abs(value).toLocaleString('de-DE')
			},
			splitLine: { lineStyle: { color: `${ACCENT_5}40` } }
		};

		/** `sign` puts the series on the negative side; labels always read absolute. */
		function bar(
			name: string,
			color: string,
			labelColor: string,
			sign: 1 | -1,
			valueOf: (point: Point) => number
		) {
			return {
				name,
				type: 'bar',
				stack: 'budget',
				barMaxWidth: 34,
				itemStyle: { color },
				emphasis: { focus: 'series' },
				label: {
					show: true,
					position: 'inside',
					fontSize: 9,
					fontWeight: 'bold',
					color: labelColor,
					formatter: (params: { value: number }) =>
						Math.abs(params.value) > 0 ? String(Math.abs(params.value)) : ''
				},
				data: points.map((point) => Math.round(valueOf(point)) * sign)
			};
		}

		return {
			grid: { left: 6, right: 18, top: 16, bottom: 44, containLabel: true },
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				formatter: (params: unknown) => {
					const rows = params as TooltipRow[];
					if (!rows.length) return '';
					const point = points[rows[0].dataIndex];
					const total = point.gastado + point.restante;
					return `<div style="font-weight:600;margin-bottom:4px">${point.categoria}</div>
						<div style="display:flex;align-items:center;gap:6px">
							<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${GASTADO_COLOR}"></span>
							<span>Gastado</span><span style="margin-left:auto;font-weight:600">${formatCurrency(point.gastado * 1000)}</span>
						</div>
						<div style="display:flex;align-items:center;gap:6px">
							<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${RESTANTE_COLOR}"></span>
							<span>Restante</span><span style="margin-left:auto;font-weight:600">${formatCurrency(point.restante * 1000)}</span>
						</div>
						<div style="display:flex;gap:6px;margin-top:2px;border-top:1px solid ${ACCENT_4}40;padding-top:2px">
							<span>Total</span><span style="margin-left:auto;font-weight:600">${formatCurrency(total * 1000)}</span>
						</div>`;
				}
			},
			labelLayout: { hideOverlap: true },
			legend: {
				bottom: 0,
				icon: 'roundRect',
				itemWidth: 10,
				itemHeight: 10,
				textStyle: { fontSize: 11 },
				data: [
					{ name: 'Gastado', itemStyle: { color: GASTADO_COLOR } },
					{ name: 'Restante', itemStyle: { color: RESTANTE_COLOR } }
				]
			},
			xAxis: valueAxis,
			yAxis: { ...categoryAxis, inverse: true },
			series: [
				bar('Gastado', GASTADO_COLOR, '#ffffff', 1, (point) => point.gastado),
				bar('Restante', RESTANTE_COLOR, readableText(RESTANTE_COLOR), -1, (point) => point.restante)
			]
		};
	});
</script>

{#if points.length === 0}
	<p class="text-sm text-accent-4">Sin sobres configurados.</p>
{:else}
	<EChart option={chartOption} {height} {minWidth} />
{/if}
