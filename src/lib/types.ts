import type { BudgetMode } from './config';

export interface RawRow {
	categoria?: string;
	fecha?: string;
	mes?: string;
	persona?: string;
	comercio?: string;
	descripcion?: string;
	subcategoria?: string;
	grupo?: string;
	super?: string;
	nota?: string;
	sobre?: string;
	monto?: string | number;
}

export interface NormalizedRow {
	fecha: string;
	mes: string;
	categoria: string;
	grupo: string;
	persona: string;
	comercio: string;
	descripcion: string;
	nota: string;
	monto: number;
	original: RawRow;
}

export interface Budget {
	min: number;
	max: number;
	mode: BudgetMode;
}

export interface CategoryAggregate {
	categoria: string;
	sum: number;
	pct: number;
}

export interface NotaAggregate {
	nota: string;
	sobre: string;
	sum: number;
}

export interface GrupoAggregate {
	grupo: string;
	sum: number;
}

export interface PersonaAggregate {
	persona: string;
	sum: number;
}

export interface MonthAggregate {
	/** Month key as it appears in the sheet, e.g. "Oct". */
	mes: string;
	sum: number;
	/** 0-based index within the fixed Jan..Dec order (-1 if unknown). */
	index: number;
}

export type MomDirection = 'up' | 'down' | 'flat';

export interface MomDelta {
	/** Absolute difference (current - previous). */
	delta: number;
	/** Percentage change vs the previous month, rounded. */
	pct: number;
	direction: MomDirection;
	/** False when there is no previous month to compare against. */
	hasPrevious: boolean;
}

export interface CategoryMom {
	categoria: string;
	current: number;
	previous: number;
	delta: MomDelta;
}

export interface BudgetStatus {
	label: string;
	color: string;
	inRange: boolean;
	underExhaust: boolean;
	overMax: boolean;
}
