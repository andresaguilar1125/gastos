import {
	DATA_URL,
	DEFAULT_APORTES,
	DEFAULT_SAVINGS_LINES,
	INGRESO_DEFAULT,
	APORTE_SCALE,
	SAVINGS_CATEGORY
} from '$lib/config';
import { fetchCsv } from '$lib/data/fetcher';
import { normalizeRows } from '$lib/data/normalize';
import { parseCsv } from '$lib/data/parser';
import {
	categoryMom,
	filterUpToMonth,
	momDelta,
	sumByMonth,
	totalSpend,
	formatYearMonth
} from '$lib/data/aggregates';
import { monthlyGrid, piggyBanks } from '$lib/budget/piggy';
import type { NormalizedRow, SavingsLine } from '$lib/types';

const PLAN_KEY = 'finanzas-plan';
// Savings lines live on the Ahorros tab (NOT `finanzas-savings-*`, which is the
// wiped legacy prefix below).
const SAVINGS_KEY = 'finanzas-ahorros';
const URL_KEY = 'finanzas-data-url';
// DEV ONLY: manual "reference month". Remove for production.
const MONTH_OVERRIDE_KEY = 'finanzas-dev-month-override';

/** Legacy keys wiped on hydrate (destructive cleanup). */
const LEGACY_KEYS = ['finanzas-budgets'];

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

function removeStorage(key: string): void {
	if (!isBrowser) return;
	try {
		localStorage.removeItem(key);
	} catch {
		/* ignore */
	}
}

function createPlanStore() {
	// `ingreso` and `aportes` are the live/committed state. `draft` holds unsaved
	// edits made in Configuración until the user presses "Guardar cambios".
	let ingreso = $state<number>(INGRESO_DEFAULT);
	let aportes = $state<Record<string, number>>({ ...DEFAULT_APORTES });
	let draftIngreso = $state<number>(INGRESO_DEFAULT);
	let draftAportes = $state<Record<string, number>>({ ...DEFAULT_APORTES });
	let savedAt = $state<Date | null>(null);
	// Legacy single Ahorros aporte, captured before it is dropped from `aportes`
	// so `savingsStore.hydrate()` can seed one savings line from it.
	let legacyAhorroAporte = $state<number>(0);

	function isDirty() {
		return (
			ingreso !== draftIngreso || JSON.stringify(aportes) !== JSON.stringify(draftAportes)
		);
	}

	function hydrate() {
		legacyAhorroAporte = 0;
		const raw = readStorage(PLAN_KEY);
		if (raw) {
			try {
				const parsed = JSON.parse(raw) as {
					ingreso?: number;
					aportes?: Record<string, number | { cap?: number }>;
				};
				if (typeof parsed.ingreso === 'number') ingreso = parsed.ingreso;

				const merged: Record<string, number> = { ...DEFAULT_APORTES };
				for (const [key, value] of Object.entries(parsed.aportes ?? {})) {
					if (typeof value === 'number') merged[key] = value;
					else if (value && typeof value.cap === 'number') merged[key] = value.cap;
				}
				// Ahorros is no longer an aporte (it is a savings line now). Capture the
				// legacy value, then drop the key so it can never reappear here.
				legacyAhorroAporte = merged[SAVINGS_CATEGORY] ?? 0;
				delete merged[SAVINGS_CATEGORY];
				aportes = merged;
			} catch {
				ingreso = INGRESO_DEFAULT;
				aportes = { ...DEFAULT_APORTES };
			}
		}

		// Destructive cleanup of legacy keys (budgets + old savings buckets).
		LEGACY_KEYS.forEach(removeStorage);
		if (isBrowser) {
			try {
				for (const key of Object.keys(localStorage)) {
					if (key.startsWith('finanzas-savings-')) localStorage.removeItem(key);
				}
			} catch {
				/* ignore */
			}
		}

		draftIngreso = ingreso;
		draftAportes = { ...aportes };
	}

	/** Update the draft aporte only; call save() to persist. */
	function updateAporte(category: string, aporteMil: number) {
		const value = Math.max(0, Math.ceil(aporteMil) || 0);
		draftAportes = { ...draftAportes, [category]: value };
	}

	function updateIngreso(ingresoMil: number) {
		draftIngreso = Math.max(0, Math.ceil(ingresoMil) || 0);
	}

	/** Reset a single category in the draft only. */
	function reset(category: string) {
		const def = DEFAULT_APORTES[category] ?? 0;
		draftAportes = { ...draftAportes, [category]: def };
	}

	/** Reset every category in the draft only. */
	function resetAll() {
		draftAportes = { ...DEFAULT_APORTES };
		draftIngreso = INGRESO_DEFAULT;
	}

	/** Discard unsaved draft changes. */
	function discard() {
		draftAportes = { ...aportes };
		draftIngreso = ingreso;
	}

	/** Commit the draft and persist it. */
	function save() {
		aportes = { ...draftAportes };
		ingreso = draftIngreso;
		writeStorage(PLAN_KEY, JSON.stringify({ ingreso, aportes }));
		savedAt = new Date();
	}

	return {
		get ingreso() {
			return ingreso;
		},
		get aportes() {
			return aportes;
		},
		get draftIngreso() {
			return draftIngreso;
		},
		get draftAportes() {
			return draftAportes;
		},
		get savedAt() {
			return savedAt;
		},
		get legacyAhorroAporte() {
			return legacyAhorroAporte;
		},
		isDirty,
		hydrate,
		updateAporte,
		updateIngreso,
		reset,
		resetAll,
		discard,
		save
	};
}

export const planStore = createPlanStore();

/** Best-effort unique id for a savings line (no crypto dependency at SSR). */
function newLineId(): string {
	if (isBrowser && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Coerce one persisted value into a valid `SavingsLine`. */
function coerceLine(raw: unknown): SavingsLine | null {
	if (!raw || typeof raw !== 'object') return null;
	const value = raw as Partial<SavingsLine>;
	const name = typeof value.name === 'string' ? value.name.trim() : '';
	if (!name) return null;
	return {
		id: typeof value.id === 'string' && value.id ? value.id : newLineId(),
		name,
		icon: typeof value.icon === 'string' && value.icon ? value.icon : 'PiggyBank',
		amountMil: Math.max(0, Math.ceil(Number(value.amountMil) || 0))
	};
}

function createSavingsStore() {
	let lines = $state<SavingsLine[]>([]);

	function persist() {
		writeStorage(SAVINGS_KEY, JSON.stringify({ lines }));
	}

	function hydrate() {
		let stored: SavingsLine[] = [];

		const raw = readStorage(SAVINGS_KEY);
		if (raw) {
			try {
				const parsed = JSON.parse(raw) as { lines?: unknown[] };
				stored = (parsed.lines ?? [])
					.map(coerceLine)
					.filter((line): line is SavingsLine => line !== null);
			} catch {
				stored = [];
			}
		}

		// Migrate the legacy single Ahorros aporte into one savings line.
		if (stored.length === 0) {
			const legacy = planStore.legacyAhorroAporte;
			if (legacy > 0) {
				stored = [{ id: newLineId(), name: 'Ahorros', icon: 'PiggyBank', amountMil: legacy }];
			}
		}

		lines = stored;
	}

	function addLine(line: { name: string; icon: string; amountMil: number }): void {
		lines = [
			...lines,
			{
				id: newLineId(),
				name: line.name.trim(),
				icon: line.icon || 'PiggyBank',
				amountMil: Math.max(0, Math.ceil(line.amountMil) || 0)
			}
		];
		persist();
	}

	function updateLine(id: string, patch: Partial<Omit<SavingsLine, 'id'>>): void {
		lines = lines.map((line) => {
			if (line.id !== id) return line;
			return {
				...line,
				name: patch.name !== undefined ? patch.name.trim() : line.name,
				icon: patch.icon ?? line.icon,
				amountMil:
					patch.amountMil !== undefined
						? Math.max(0, Math.ceil(patch.amountMil) || 0)
						: line.amountMil
			};
		});
		persist();
	}

	function removeLine(id: string): void {
		lines = lines.filter((line) => line.id !== id);
		persist();
	}

	return {
		get lines() {
			return lines;
		},
		hydrate,
		addLine,
		updateLine,
		removeLine
	};
}

export const savingsStore = createSavingsStore();

function createDataStore() {
	let csvText = $state<string>('');
	let loading = $state<boolean>(false);
	let error = $state<string | null>(null);
	let cached = $state<boolean>(false);
	let fetchedAt = $state<Date | null>(null);
	let dataUrl = $state<string>(DATA_URL);
	let rawRows = $state<NormalizedRow[]>([]);

	// The month treated as "current". Kept in localStorage so it survives reloads.
	let monthFilter = $state<string | null>(null);

	/** Months present in the sheet, in calendar order (YYYY-MM). */
	let allMonths = $derived(sumByMonth(rawRows).map((m) => m.yearMonth));
	/** The latest month available in the sheet (no filter applied). */
	let latestAvailableMonth = $derived(allMonths.length ? allMonths[allMonths.length - 1] : null);

	/**
	 * Everything below is derived from rows TRUNCATED at the reference month,
	 * so picking August hides September and October completely.
	 */
	let rows = $derived(filterUpToMonth(rawRows, monthFilter ?? latestAvailableMonth));

	/** Spending excludes Ahorros: savings are not spend (§12.6). */
	let spendingRows = $derived(rows.filter((r) => r.categoria !== SAVINGS_CATEGORY));

	let total = $derived(totalSpend(spendingRows));
	let monthSums = $derived(sumByMonth(spendingRows));

	/** The month currently selected, clamped to what actually has data. */
	let refMonth = $derived.by(() => {
		if (monthFilter && allMonths.includes(monthFilter)) return monthFilter;
		return latestAvailableMonth;
	});
	let availableMonths = $derived(monthSums.map((m) => m.yearMonth));
	let previousMonth = $derived.by(() => {
		if (!refMonth) return null;
		const idx = availableMonths.indexOf(refMonth);
		return idx > 0 ? availableMonths[idx - 1] : null;
	});
	let refMonthSum = $derived(
		refMonth ? (monthSums.find((m) => m.yearMonth === refMonth)?.sum ?? 0) : 0
	);
	let previousMonthSum = $derived(
		previousMonth ? (monthSums.find((m) => m.yearMonth === previousMonth)?.sum ?? 0) : 0
	);
	let momTotal = $derived(momDelta(refMonthSum, previousMonthSum, previousMonth != null));
	let categoryMomSums = $derived(refMonth ? categoryMom(rows, refMonth, previousMonth) : []);

	/** The piggy banks, built from the committed plan + the filtered ledger. */
	let piggyBanksList = $derived(piggyBanks(rows, planStore.aportes, refMonth));
	let monthGrid = $derived(monthlyGrid(rows, planStore.aportes, availableMonths));

	function hydrateUrl() {
		const stored = readStorage(URL_KEY);
		if (stored) dataUrl = stored;
	}

	/** Set or clear the reference month. Filters the entire dataset. */
	function setMonthFilter(yearMonth: string | null) {
		monthFilter = yearMonth;
		if (yearMonth) writeStorage(MONTH_OVERRIDE_KEY, yearMonth);
		else removeStorage(MONTH_OVERRIDE_KEY);
	}

	function hydrateMonthFilter() {
		const stored = readStorage(MONTH_OVERRIDE_KEY);
		if (stored) monthFilter = stored;
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
		get csvText() {
			return csvText;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get cached() {
			return cached;
		},
		get fetchedAt() {
			return fetchedAt;
		},
		get dataUrl() {
			return dataUrl;
		},
		get rawRows() {
			return rawRows;
		},
		get rows() {
			return rows;
		},
		get spendingRows() {
			return spendingRows;
		},
		get total() {
			return total;
		},
		get monthSums() {
			return monthSums;
		},
		get availableMonths() {
			return availableMonths;
		},
		get allMonths() {
			return allMonths;
		},
		get latestAvailableMonth() {
			return latestAvailableMonth;
		},
		get monthFilter() {
			return monthFilter;
		},
		get refMonth() {
			return refMonth;
		},
		get previousMonth() {
			return previousMonth;
		},
		get refMonthSum() {
			return refMonthSum;
		},
		get previousMonthSum() {
			return previousMonthSum;
		},
		get momTotal() {
			return momTotal;
		},
		get categoryMomSums() {
			return categoryMomSums;
		},
		get piggyBanks() {
			return piggyBanksList;
		},
		get monthGrid() {
			return monthGrid;
		},
		hydrateUrl,
		hydrateMonthFilter,
		setMonthFilter,
		load,
		setUrl
	};
}

export const dataStore = createDataStore();

/** Call once on the client to restore persisted state before rendering. */
export function hydrateStores(): void {
	dataStore.hydrateUrl();
	dataStore.hydrateMonthFilter();
	planStore.hydrate();
	// After planStore so the legacy Ahorros aporte can seed a savings line.
	savingsStore.hydrate();
}

export { DATA_URL, DEFAULT_APORTES, DEFAULT_SAVINGS_LINES, APORTE_SCALE, CATEGORY_COLORS } from '$lib/config';
export { formatYearMonth } from '$lib/data/aggregates';
export { formatCurrency, formatPct, toDisplayValue } from '$lib/format';
