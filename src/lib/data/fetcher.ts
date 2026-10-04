import { DATA_URL } from '$lib/config';

const CSV_CACHE_KEY = 'finanzas-csv-last';
const CSV_CACHE_META_KEY = 'finanzas-csv-meta';

interface CsvMeta {
	url: string;
	fetchedAt: string;
}

export interface FetchResult {
	csvText: string;
	cached: boolean;
	fetchedAt: Date;
	error?: string;
}

export async function fetchCsv(url = DATA_URL): Promise<FetchResult> {
	try {
		const response = await fetch(url, { cache: 'no-store' });
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		const csvText = await response.text();
		const meta: CsvMeta = { url, fetchedAt: new Date().toISOString() };
		localStorage.setItem(CSV_CACHE_KEY, csvText);
		localStorage.setItem(CSV_CACHE_META_KEY, JSON.stringify(meta));
		return { csvText, cached: false, fetchedAt: new Date() };
	} catch (err) {
		const fallback = localStorage.getItem(CSV_CACHE_KEY);
		const metaRaw = localStorage.getItem(CSV_CACHE_META_KEY);
		if (fallback) {
			const meta: CsvMeta = metaRaw ? JSON.parse(metaRaw) : { url, fetchedAt: 'unknown' };
			return {
				csvText: fallback,
				cached: true,
				fetchedAt: new Date(meta.fetchedAt),
				error: err instanceof Error ? err.message : String(err)
			};
		}
		throw err;
	}
}
