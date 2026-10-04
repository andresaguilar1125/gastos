import type { Snippet } from 'svelte';
import { writable } from 'svelte/store';

const THEME_KEY = 'finanzas-theme';

type Theme = 'light' | 'dark';

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

function getInitialTheme(): Theme {
	if (!isBrowser) return 'light';
	try {
		const stored = localStorage.getItem(THEME_KEY) as Theme | null;
		if (stored === 'dark' || stored === 'light') return stored;
	} catch {
		/* ignore */
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(value: Theme) {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', value === 'dark');
	document.documentElement.classList.toggle('light', value !== 'dark');
	if (isBrowser) {
		try {
			localStorage.setItem(THEME_KEY, value);
		} catch {
			/* ignore privacy-mode errors */
		}
	}
}

function createTheme() {
	const { subscribe, set } = writable<Theme>(getInitialTheme());

	function toggle() {
		let next: Theme = 'light';
		subscribe((v) => {
			next = v === 'dark' ? 'light' : 'dark';
		})();
		apply(next);
		set(next);
	}

	function setTheme(value: Theme) {
		apply(value);
		set(value);
	}

	return { subscribe, set: setTheme, toggle, apply };
}

export const theme = createTheme();

export function setPageTitle(title: string) {
	if (typeof document !== 'undefined') {
		document.title = `${title} | Gastos`;
	}
}

export type { Snippet };
