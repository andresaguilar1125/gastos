import {
	DEFAULT_BUDGETS,
	AHORRO_DUPLICATE_FACTOR,
	DATA_URL,
	CATEGORY_COLORS,
	BUDGET_SCALE,
	type Budgets
} from '$lib/config';
import { fetchCsv } from '$lib/data/fetcher';
import { normalizeRows } from '$lib/data/normalize';
import { parseCsv } from '$lib/data/parser';
import {
	injectAhorroDuplicates,
	categoryMom,
	momDelta,
	sumByCategory,
	sumByGrupo,
	sumByMonth,
	sumByNota,
	sumByPersona,
	totalSpend
} from '$lib/data/aggregates';
import type { NormalizedRow } from '$lib/types';

const BUDGETS_KEY = 'finanzas-budgets';
const URL_KEY = 'finanzas-data-url';
const AHORRO_KEY = 'finanzas-ahorro-factor';
// DEV ONLY: manual "current month" override. Remove for production.
const MONTH_OVERRIDE_KEY = 'finanzas-dev-month-override';

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

function readStorage(key: string): string | null {
	if (!isBrowser) return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(key: string, value: string): void {
	if (!isBrowser) return;
	try {
		localStorage.setItem(key, value);
	} catch {
		/* ignore quota / privacy-mode errors */
	}
}

function createDataStore() {
	let csvText = $state<string>('');
	let loading = $state<boolean>(false);
	let error = $state<string | null>(null);
	let cached = $state<boolean>(false);
	let fetchedAt = $state<Date | null>(null);
	let dataUrl = $state<string>(DATA_URL);

	let rawRows = $state<NormalizedRow[]>([]);

	// DEV ONLY: when set, this month is forced as "current" instead of the
	// latest month found in the sheet. Cleared on production deploys.
	let devMonthOverride = $state<string | null>(null);

	let rows = $derived(injectAhorroDuplicates(rawRows));
	let categorySums = $derived(sumByCategory(rows));
	let notaSums = $derived(sumByNota(rows));
	let grupoSums = $derived(sumByGrupo(rows));
	let personaSums = $derived(sumByPersona(rows));
	let total = $derived(totalSpend(rows));

	let monthSums = $derived(sumByMonth(rows));
	let availableMonths = $derived(monthSums.map((m) => m.mes));

	/** The month treated as "current": the dev override if set, else the latest. */
	let latestMonth = $derived.by(() => {
		if (devMonthOverride && availableMonths.includes(devMonthOverride)) return devMonthOverride;
		return monthSums.length ? monthSums[monthSums.length - 1].mes : null;
	});
	let previousMonth = $derived.by(() => {
		if (!latestMonth) return null;
		const idx = availableMonths.indexOf(latestMonth);
		return idx > 0 ? availableMonths[idx - 1] : null;
	});
	let latestMonthSum = $derived(
		latestMonth
			? (monthSums.find((m) => m.mes === latestMonth)?.sum ?? 0)
			: monthSums.length
				? monthSums[monthSums.length - 1].sum
				: 0
	);
	let previousMonthSum = $derived(
		previousMonth ? (monthSums.find((m) => m.mes === previousMonth)?.sum ?? 0) : 0
	);
	let momTotal = $derived(momDelta(latestMonthSum, previousMonthSum, previousMonth != null));
	let categoryMomSums = $derived(
		latestMonth ? categoryMom(rows, latestMonth, previousMonth) : []
	);

	function hydrateUrl() {
		const stored = readStorage(URL_KEY);
		if (stored) dataUrl = stored;
	}

	/** DEV ONLY: set or clear the manual current-month override. */
	function setDevMonthOverride(mes: string | null) {
		devMonthOverride = mes;
		if (mes) writeStorage(MONTH_OVERRIDE_KEY, mes);
		else if (isBrowser) {
			try {
				localStorage.removeItem(MONTH_OVERRIDE_KEY);
			} catch {
				/* ignore */
			}
		}
	}

	function hydrateDevMonthOverride() {
		const stored = readStorage(MONTH_OVERRIDE_KEY);
		if (stored) devMonthOverride = stored;
	}

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
		writeStorage(URL_KEY, url);
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
		get monthSums() { return monthSums; },
		get availableMonths() { return availableMonths; },
		get devMonthOverride() { return devMonthOverride; },
		get latestMonth() { return latestMonth; },
		get previousMonth() { return previousMonth; },
		get latestMonthSum() { return latestMonthSum; },
		get previousMonthSum() { return previousMonthSum; },
		get momTotal() { return momTotal; },
		get categoryMomSums() { return categoryMomSums; },
		hydrateUrl,
		hydrateDevMonthOverride,
		setDevMonthOverride,
		load,
		setUrl
	};
}

export const dataStore = createDataStore();

function createBudgetStore() {
	let budgets = $state<Budgets>({ ...DEFAULT_BUDGETS });

	function hydrate() {
		const raw = readStorage(BUDGETS_KEY);
		if (!raw) return;
		try {
			const parsed = JSON.parse(raw) as Record<string, { min?: number; max?: number }>;
			// Merge into defaults and drop the removed `mode` field.
			const merged: Budgets = { ...DEFAULT_BUDGETS };
			for (const [key, value] of Object.entries(parsed)) {
				if (!value || typeof value.min !== 'number' || typeof value.max !== 'number') continue;
				merged[key] = { min: value.min, max: value.max };
			}
			budgets = merged;
		} catch {
			budgets = { ...DEFAULT_BUDGETS };
		}
	}

	function update(category: string, patch: Partial<{ min: number; max: number }>) {
		const current =
			budgets[category] ??
			DEFAULT_BUDGETS[category as keyof typeof DEFAULT_BUDGETS] ?? { min: 0, max: 0 };
		budgets = { ...budgets, [category]: { ...current, ...patch } };
		writeStorage(BUDGETS_KEY, JSON.stringify(budgets));
	}

	function reset(category: string) {
		const def = DEFAULT_BUDGETS[category as keyof typeof DEFAULT_BUDGETS];
		if (def) {
			budgets = { ...budgets, [category]: { ...def } };
			writeStorage(BUDGETS_KEY, JSON.stringify(budgets));
		}
	}

	function resetAll() {
		budgets = { ...DEFAULT_BUDGETS };
		writeStorage(BUDGETS_KEY, JSON.stringify(budgets));
	}

	return {
		get budgets() { return budgets; },
		hydrate,
		update,
		reset,
		resetAll
	};
}

export const budgetStore = createBudgetStore();

function createSettingsStore() {
	let ahorroFactor = $state<number>(AHORRO_DUPLICATE_FACTOR);

	function hydrate() {
		const stored = readStorage(AHORRO_KEY);
		if (stored == null) return;
		const parsed = Number(stored);
		if (Number.isFinite(parsed)) ahorroFactor = Math.max(1, Math.round(parsed));
	}

	return {
		get ahorroFactor() { return ahorroFactor; },
		set ahorroFactor(v: number) {
			ahorroFactor = Math.max(1, Math.round(v) || 1);
			writeStorage(AHORRO_KEY, String(ahorroFactor));
		},
		hydrate
	};
}

export const settingsStore = createSettingsStore();

/** Call once on the client to restore persisted state before rendering. */
export function hydrateStores(): void {
	dataStore.hydrateUrl();
	dataStore.hydrateDevMonthOverride();
	budgetStore.hydrate();
	settingsStore.hydrate();
}

export { DATA_URL, CATEGORY_COLORS, AHORRO_DUPLICATE_FACTOR, BUDGET_SCALE, DEFAULT_BUDGETS };
export type { Budgets };
