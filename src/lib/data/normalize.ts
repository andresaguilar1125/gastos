import type { NormalizedRow, RawRow } from '$lib/types';

const PERSONA_ALIASES: Record<string, string> = {
	andres: 'Andres',
	'andres#': 'Andres',
	mari: 'Mari',
	'mari#': 'Mari',
	trabajo: 'Trabajo'
};

export function normalizeRows(rows: RawRow[]): NormalizedRow[] {
	return rows
		.map((row) => {
			const montoRaw = row.monto;
			const monto = montoRaw == null || montoRaw === '' ? NaN : Math.ceil(Number(montoRaw));
			const categoria = (row.categoria ?? '').trim();
			if (!categoria || Number.isNaN(monto)) return null;

			const rawPersona = (row.persona ?? '').trim().toLowerCase();
			const persona = PERSONA_ALIASES[rawPersona] ?? rawPersona;

			return {
				fecha: (row.fecha ?? row.mes ?? '').trim(),
				categoria,
				grupo: (row.subcategoria ?? row.grupo ?? '').trim(),
				persona,
				nota: (row.nota ?? row.sobre ?? '').trim(),
				monto,
				original: row
			};
		})
		.filter((r): r is NormalizedRow => r != null);
}
