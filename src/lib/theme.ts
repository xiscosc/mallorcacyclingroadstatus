import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
	if (!browser) return 'dark';
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export const theme: Writable<Theme> = writable(getInitialTheme());

if (browser) {
	theme.subscribe((value) => {
		const el = document.documentElement;
		el.classList.toggle('dark', value === 'dark');
		el.classList.toggle('light', value === 'light');
		try {
			localStorage.setItem('theme', value);
		} catch {
			// no-op: localStorage unavailable (e.g. Safari private mode)
		}
	});
}

export function toggleTheme(): void {
	theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
}
