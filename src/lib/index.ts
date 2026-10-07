export {
	DATA_URL,
	DEFAULT_APORTES,
	DEFAULT_SAVINGS_LINES,
	CATEGORY_COLORS,
	APORTE_SCALE,
	CATEGORIES
} from './config.js';
export * from './types.js';
export { parseCsv } from './data/parser.js';
export { normalizeRows, parseYearMonth } from './data/normalize.js';
export {
	filterUpToMonth,
	sumByCategory,
	sumBySuperMatch,
	sumByComercio,
	sumByPersona,
	sumByMonth,
	sumByCategoryForMonth,
	monthMapForCategory,
	monthIndex,
	monthToken,
	formatYearMonth,
	momDelta,
	categoryMom,
	totalSpend
} from './data/aggregates.js';
export {
	elapsedMonths,
	globalEpoch,
	piggyBanks,
	monthlyGrid,
	categoryMonthSeries,
	averagePerMonth
} from './budget/piggy.js';
export { savingsMonths, savingsProgress, savingsTotals } from './budget/savings.js';
export { SAVINGS_ICONS, SAVINGS_ICON_NAMES, savingsIcon } from './ui/icons.js';
export { fetchCsv } from './data/fetcher.js';
export * from './stores/index.svelte.js';
export { formatCurrency, formatPct, formatThousands, toDisplayValue, clamp } from './format.js';
export { theme, setPageTitle } from './ui/theme.js';
