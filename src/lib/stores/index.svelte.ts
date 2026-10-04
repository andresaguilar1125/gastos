import {
	DEFAULT_BUDGETS,
	AHORRO_DUPLICATE_FACTOR,
	DATA_URL,
	CATEGORY_COLORS,
	type BudgetMode,
	type Budgets
} from '$lib/config';
import { fetchCsv } from '$lib/data/fetcher';
import { normalizeRows } from '$lib/data/normalize';
import { parseCsv } from '$lib/data/parser';
import {
	injectAhorroDuplicates,
	sumByCategory,
	sumByGrupo,
	sumByNota,
	sumByPersona,
	totalSpend
} from '$lib/data/aggregates';
import type { NormalizedRow } from '$lib/types';

const BUDGETS_KEY = 'finanzas-budgets';
const URL_KEY = 'finanzas-data-url';
const AHORRO_KEY = 'finanzas-ahorro-factor';

function createDataStore() {
	let csvText = $state<string>('');
	let loading = $state<boolean>(false);
	let error = $state<string | null>(null);
	let cached = $state<boolean>(false);
	let fetchedAt = $state<Date | null>(null);
	let dataUrl = $state<string>(localStorage.getItem(URL_KEY) ?? DATA_URL);

	let rawRows = $state<NormalizedRow[]>([]);

	let rows = $derived(injectAhorroDuplicates(rawRows));
	let categorySums = $derived(sumByCategory(rows));
	let notaSums = $derived(sumByNota(rows));
	let grupoSums = $derived(sumByGrupo(rows));
	let personaSums = $derived(sumByPersona(rows));
	let total = $derived(totalSpend(rows));

	async function load(url = dataUrl) {
		loading = true;
		error = null;
		try {
			const result = await fetchCsv(url);
			csvText = result.csvText;
			cached = result.cached;
			fetchedAt = result.fetchedAt;
			rawRows = normalizeRows(parseCsv(csvText));
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			csvText = '';
			rawRows = [];
		} finally {
			loading = false;
		}
	}

	function setUrl(url: string) {
		dataUrl = url;
		localStorage.setItem(URL_KEY, url);
		load(url);
	}

	return {
		get csvText() { return csvText; },
		get loading() { return loading; },
		get error() { return error; },
		get cached() { return cached; },
		get fetchedAt() { return fetchedAt; },
		get dataUrl() { return dataUrl; },
		get rawRows() { return rawRows; },
		get rows() { return rows; },
		get categorySums() { return categorySums; },
		get notaSums() { return notaSums; },
		get grupoSums() { return grupoSums; },
		get personaSums() { return personaSums; },
		get total() { return total; },
		load,
		setUrl
	};
}

export const dataStore = createDataStore();

function createBudgetStore() {
	const initialRaw = localStorage.getItem(BUDGETS_KEY);
	const parsed = initialRaw ? (JSON.parse(initialRaw) as Budgets) : {};
	const merged: Budgets = { ...DEFAULT_BUDGETS, ...parsed };

	let budgets = $state<Budgets>(merged);

	$effect(() => {
		localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
	});

	function update(category: string, patch: Partial<{ min: number; max: number; mode: BudgetMode }>) {
		const current = budgets[category] ?? DEFAULT_BUDGETS[category as keyof typeof DEFAULT_BUDGETS] ?? { min: 0, max: 0, mode: 'range' as const };
		budgets[category] = { ...current, ...patch };
	}

	function reset(category: string) {
		const def = DEFAULT_BUDGETS[category as keyof typeof DEFAULT_BUDGETS];
		if (def) budgets[category] = { ...def };
	}

	function resetAll() {
		budgets = { ...DEFAULT_BUDGETS };
	}

	return {
		get budgets() { return budgets; },
		update,
		reset,
		resetAll
	};
}

export const budgetStore = createBudgetStore();

function createSettingsStore() {
	let ahorroFactor = $state<number>(
		Math.max(1, Number(localStorage.getItem(AHORRO_KEY) ?? AHORRO_DUPLICATE_FACTOR))
	);

	$effect(() => {
		localStorage.setItem(AHORRO_KEY, String(ahorroFactor));
	});

	return {
		get ahorroFactor() { return ahorroFactor; },
		set ahorroFactor(v: number) { ahorroFactor = Math.max(1, Math.round(v)); }
	};
}

export const settingsStore = createSettingsStore();

export { DATA_URL, CATEGORY_COLORS, AHORRO_DUPLICATE_FACTOR, DEFAULT_BUDGETS };
export type { BudgetMode, Budgets };
