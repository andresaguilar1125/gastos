import Papa from 'papaparse';
import type { RawRow } from './types';

export function parseCsv(csvText: string): RawRow[] {
	const parsed = Papa.parse<RawRow>(csvText, {
		header: true,
		dynamicTyping: false,
		skipEmptyLines: true,
		transformHeader: (header: string) => header.trim().toLowerCase()
	});
	return parsed.data;
}
