import type { Snippet } from 'svelte';
import { writable } from 'svelte/store';

const THEME_KEY = 'finanzas-theme';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
	if (typeof window === 'undefined') return 'light';
	const stored = localStorage.getItem(THEME_KEY) as Theme | null;
	if (stored === 'dark' || stored === 'light') return stored;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function createTheme() {
	const { subscribe, set } = writable<Theme>(getInitialTheme());

	function apply(value: Theme) {
		if (typeof document === 'undefined') return;
		document.documentElement.classList.toggle('dark', value === 'dark');
		localStorage.setItem(THEME_KEY, value);
	}

	function toggle() {
		let next: Theme = 'light';
		subscribe((v) => {
			next = v === 'dark' ? 'light' : 'dark';
		})();
		apply(next);
		set(next);
	}

	apply(getInitialTheme());
	return { subscribe, set, toggle };
}

export const theme = createTheme();

export function setPageTitle(title: string) {
	if (typeof document !== 'undefined') {
		document.title = `${title} | Finanzas CRC`;
	}
}

export type { Snippet };
