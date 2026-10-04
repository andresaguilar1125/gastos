import type { BudgetMode } from './config';

export interface RawRow {
	fecha?: string;
	mes?: string;
	categoria?: string;
	subcategoria?: string;
	grupo?: string;
	persona?: string;
	nota?: string;
	sobre?: string;
	monto?: string | number;
}

export interface NormalizedRow {
	fecha: string;
	categoria: string;
	grupo: string;
	persona: string;
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

export interface BudgetStatus {
	label: string;
	color: string;
	inRange: boolean;
	underExhaust: boolean;
	overMax: boolean;
}
