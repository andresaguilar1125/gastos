import type { Budget, BudgetStatus } from '$lib/types';

export function formatCurrency(amount: number): string {
	return `₡${Math.ceil(amount).toLocaleString('es-CR')}`;
}

export function evaluateSpend(spent: number, budget: Budget): BudgetStatus {
	if (budget.mode === 'exhaust') {
		const inRange = spent >= budget.min && spent <= budget.max;
		const underExhaust = spent < budget.max;
		return {
			label: underExhaust ? 'Sin gastar' : 'Completado',
			color: underExhaust ? '#f4b400' : '#0f9d58',
			inRange,
			underExhaust,
			overMax: false
		};
	}

	if (budget.mode === 'cap') {
		const overMax = spent > budget.max;
		return {
			label: overMax ? 'Excedido' : 'Dentro del tope',
			color: overMax ? '#db4437' : '#0f9d58',
			inRange: !overMax,
			underExhaust: false,
			overMax
		};
	}

	if (budget.mode === 'target') {
		const inRange = spent >= budget.min && spent <= budget.max;
		return {
			label: inRange ? 'En meta' : spent < budget.min ? 'Por debajo' : 'Sobre meta',
			color: inRange ? '#0f9d58' : spent < budget.min ? '#f4b400' : '#db4437',
			inRange,
			underExhaust: spent < budget.min,
			overMax: spent > budget.max
		};
	}

	// range
	const inRange = spent >= budget.min && spent <= budget.max;
	const overMax = spent > budget.max;
	return {
		label: inRange ? 'En rango' : overMax ? 'Sobre rango' : 'Por debajo',
		color: inRange ? '#0f9d58' : overMax ? '#db4437' : '#f4b400',
		inRange,
		underExhaust: spent < budget.min,
		overMax
	};
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
