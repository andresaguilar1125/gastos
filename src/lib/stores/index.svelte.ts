import {
	DATA_URL,
	DEFAULT_APORTES,
	DEFAULT_RANGE_MONTHS,
	INGRESO_DEFAULT,
	AHORRO_MENSUAL_DEFAULT,
	APORTE_SCALE,
	SAVINGS_CATEGORY
} from '$lib/config';
import { fetchCsv } from '$lib/data/fetcher';
import { normalizeRows } from '$lib/data/normalize';
import { parseCsv } from '$lib/data/parser';
import {
	categoryMom,
	momDelta,
	shiftMonth,
	sumByMonth,
	totalSpend,
	formatYearMonth
} from '$lib/data/aggregates';
import { monthlyGrid, piggyBanks } from '$lib/budget/piggy';
import type { NormalizedRow } from '$lib/types';

const PLAN_KEY = 'finanzas-plan';
const URL_KEY = 'finanzas-data-url';

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
	let ahorroMensual = $state<number>(AHORRO_MENSUAL_DEFAULT);
	let draftIngreso = $state<number>(INGRESO_DEFAULT);
	let draftAportes = $state<Record<string, number>>({ ...DEFAULT_APORTES });
	let draftAhorroMensual = $state<number>(AHORRO_MENSUAL_DEFAULT);
	// Data window (months), ending at the reference month; global display filter.
	let rangeMonths = $state<number>(DEFAULT_RANGE_MONTHS);
	let draftRangeMonths = $state<number>(DEFAULT_RANGE_MONTHS);
	let savedAt = $state<Date | null>(null);

	function isDirty() {
		return (
			ingreso !== draftIngreso ||
			ahorroMensual !== draftAhorroMensual ||
			rangeMonths !== draftRangeMonths ||
			JSON.stringify(aportes) !== JSON.stringify(draftAportes)
		);
	}

	function hydrate() {
		rangeMonths = DEFAULT_RANGE_MONTHS;
		ahorroMensual = AHORRO_MENSUAL_DEFAULT;
		const raw = readStorage(PLAN_KEY);
		if (raw) {
			try {
				const parsed = JSON.parse(raw) as {
					ingreso?: number;
					ahorroMensual?: number;
					rangeMonths?: number;
					aportes?: Record<string, number | { cap?: number }>;
				};
				// Migration: a stored 0 was the old default; adopt the new one.
				if (typeof parsed.ingreso === 'number' && parsed.ingreso > 0) ingreso = parsed.ingreso;
				if (typeof parsed.ahorroMensual === 'number' && parsed.ahorroMensual > 0) {
					ahorroMensual = parsed.ahorroMensual;
				}
				if (typeof parsed.rangeMonths === 'number') rangeMonths = parsed.rangeMonths;

				const merged: Record<string, number> = { ...DEFAULT_APORTES };
				for (const [key, value] of Object.entries(parsed.aportes ?? {})) {
					if (typeof value === 'number') merged[key] = value;
					else if (value && typeof value.cap === 'number') merged[key] = value.cap;
				}
				// Migration: replace any stored 0 with the configured default so the
				// Home charts (which need a real aporte) have something to show.
				for (const [key, def] of Object.entries(DEFAULT_APORTES)) {
					if (!merged[key]) merged[key] = def;
				}
				// Drop any legacy Ahorros aporte so it can never reappear as a piggy bank.
				delete merged[SAVINGS_CATEGORY];
				aportes = merged;
			} catch {
				ingreso = INGRESO_DEFAULT;
				aportes = { ...DEFAULT_APORTES };
				ahorroMensual = AHORRO_MENSUAL_DEFAULT;
			}
		}

		// Destructive cleanup of legacy keys (budgets).
		LEGACY_KEYS.forEach(removeStorage);

		draftIngreso = ingreso;
		draftAportes = { ...aportes };
		draftAhorroMensual = ahorroMensual;
		draftRangeMonths = rangeMonths;
	}

	/** Update the draft aporte only; call save() to persist. */
	function updateAporte(category: string, aporteMil: number) {
		const value = Math.max(0, Math.ceil(aporteMil) || 0);
		draftAportes = { ...draftAportes, [category]: value };
	}

	function updateIngreso(ingresoMil: number) {
		draftIngreso = Math.max(0, Math.ceil(ingresoMil) || 0);
	}

	function updateAhorroMensual(ahorroMil: number) {
		draftAhorroMensual = Math.max(0, Math.ceil(ahorroMil) || 0);
	}

	/** Data window in months (draft only). */
	function updateRangeMonths(months: number) {
		draftRangeMonths = Math.max(1, Math.ceil(months) || DEFAULT_RANGE_MONTHS);
	}

	/** Discard unsaved draft changes. */
	function discard() {
		draftAportes = { ...aportes };
		draftIngreso = ingreso;
		draftAhorroMensual = ahorroMensual;
		draftRangeMonths = rangeMonths;
	}

	/** Commit the draft and persist it. */
	function save() {
		aportes = { ...draftAportes };
		ingreso = draftIngreso;
		ahorroMensual = draftAhorroMensual;
		rangeMonths = draftRangeMonths;
		writeStorage(PLAN_KEY, JSON.stringify({ ingreso, ahorroMensual, rangeMonths, aportes }));
		savedAt = new Date();
	}

	return {
		get ingreso() {
			return ingreso;
		},
		get aportes() {
			return aportes;
		},
		get ahorroMensual() {
			return ahorroMensual;
		},
		get rangeMonths() {
			return rangeMonths;
		},
		get draftIngreso() {
			return draftIngreso;
		},
		get draftAportes() {
			return draftAportes;
		},
		get draftAhorroMensual() {
			return draftAhorroMensual;
		},
		get draftRangeMonths() {
			return draftRangeMonths;
		},
		get savedAt() {
			return savedAt;
		},
		isDirty,
		hydrate,
		updateAporte,
		updateIngreso,
		updateAhorroMensual,
		updateRangeMonths,
		discard,
		save
	};
}

export const planStore = createPlanStore();

function createDataStore() {
	let csvText = $state<string>('');
	let loading = $state<boolean>(false);
	let error = $state<string | null>(null);
	let cached = $state<boolean>(false);
	let fetchedAt = $state<Date | null>(null);
	let dataUrl = $state<string>(DATA_URL);
	let rawRows = $state<NormalizedRow[]>([]);

	/** The latest month available in the sheet. */
	let latestAvailableMonth = $derived.by(() => {
		const months = sumByMonth(rawRows);
		return months.length ? months[months.length - 1].yearMonth : null;
	});

	/**
	 * Everything below is derived from rows clipped to the configured data
	 * window (last N months, §11), ending at the latest available month.
	 */
	const rangeStart = $derived.by(() => {
		if (!latestAvailableMonth || planStore.rangeMonths <= 0) return null;
		return shiftMonth(latestAvailableMonth, -(planStore.rangeMonths - 1));
	});

	let rows = $derived(
		rawRows.filter((row) => !row.yearMonth || !rangeStart || row.yearMonth >= rangeStart)
	);

	/** Spending excludes Ahorros: savings are not spend (§12.6). */
	let spendingRows = $derived(rows.filter((r) => r.categoria !== SAVINGS_CATEGORY));

	let total = $derived(totalSpend(spendingRows));
	let monthSums = $derived(sumByMonth(spendingRows));

	/** The reference month is always the latest month with data. */
	let refMonth = $derived(latestAvailableMonth);
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
		get latestAvailableMonth() {
			return latestAvailableMonth;
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
		load,
		setUrl
	};
}

export const dataStore = createDataStore();

/** Call once on the client to restore persisted state before rendering. */
export function hydrateStores(): void {
	dataStore.hydrateUrl();
	planStore.hydrate();
}

export { DATA_URL, DEFAULT_APORTES, APORTE_SCALE } from '$lib/config';
export { formatYearMonth } from '$lib/data/aggregates';
export { formatCurrency, formatPct, toDisplayValue } from '$lib/format';
