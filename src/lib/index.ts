export { DATA_URL, DEFAULT_BUDGETS, DEFAULT_AHORRO_MONTHLY, CATEGORY_COLORS } from './config.js';
export * from './types.js';
export { parseCsv } from './data/parser.js';
export { normalizeRows } from './data/normalize.js';
export {
	filterUpToMonth,
	sumByCategory,
	sumByMonth,
	sumByNota,
	sumByGrupo,
	sumByPersona,
	momDelta,
	categoryMom,
	totalSpend
} from './data/aggregates.js';
export { fetchCsv } from './data/fetcher.js';
export * from './stores/index.svelte.js';
export { formatCurrency, evaluateSpend, clamp } from './budget/status.js';
export { theme, setPageTitle } from './ui/theme.js';
