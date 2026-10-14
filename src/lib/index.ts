export { DATA_URL, DEFAULT_APORTES, APORTE_SCALE, CATEGORIES } from './config.js';
export * from './types.js';
export { parseCsv } from './data/parser.js';
export { normalizeRows, parseYearMonth } from './data/normalize.js';
export {
	sumByCategory,
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
	categoryMonthSeries
} from './budget/piggy.js';
export { fetchCsv } from './data/fetcher.js';
export * from './stores/index.svelte.js';
export {
	formatCurrency,
	formatPct,
	formatThousands,
	toDisplayValue,
	clamp,
	roundUpTo
} from './format.js';
export { setPageTitle } from './ui/theme.js';
