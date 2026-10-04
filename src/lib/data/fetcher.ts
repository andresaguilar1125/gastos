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

function readCache(): string | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		return localStorage.getItem(CSV_CACHE_KEY);
	} catch {
		return null;
	}
}

function readMeta(): string | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		return localStorage.getItem(CSV_CACHE_META_KEY);
	} catch {
		return null;
	}
}

function writeCache(csvText: string, meta: CsvMeta): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(CSV_CACHE_KEY, csvText);
		localStorage.setItem(CSV_CACHE_META_KEY, JSON.stringify(meta));
	} catch {
		/* ignore quota / privacy-mode errors */
	}
}

export async function fetchCsv(url = DATA_URL): Promise<FetchResult> {
	try {
		const response = await fetch(url, { cache: 'no-store' });
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		const csvText = await response.text();
		const meta: CsvMeta = { url, fetchedAt: new Date().toISOString() };
		writeCache(csvText, meta);
		return { csvText, cached: false, fetchedAt: new Date() };
	} catch (err) {
		const fallback = readCache();
		const metaRaw = readMeta();
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
