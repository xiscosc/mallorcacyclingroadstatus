import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['cookie', 'preferredLanguage', 'url', 'baseLocale'],
			// Treat these paths as locale-agnostic — no auto-redirect, no de-localization.
			// They live at a single canonical URL.
			routeStrategies: [
				{ match: '/sitemap.xml', exclude: true },
				{ match: '/robots.txt', exclude: true }
			]
		})
	]
});
