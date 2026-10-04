export { DATA_URL, AHORRO_DUPLICATE_FACTOR, DEFAULT_BUDGETS, CATEGORY_COLORS } from './config.js';
export * from './types.js';
export { parseCsv } from './data/parser.js';
export { normalizeRows } from './data/normalize.js';
export {
	injectAhorroDuplicates,
	sumByCategory,
	sumByNota,
	sumByGrupo,
	sumByPersona,
	totalSpend
} from './data/aggregates.js';
export { fetchCsv } from './data/fetcher.js';
export * from './stores/index.svelte.js';
export { formatCurrency, evaluateSpend, clamp } from './budget/status.js';
export { theme, setPageTitle } from './ui/theme.js';
