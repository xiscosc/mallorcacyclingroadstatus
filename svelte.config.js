import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({
			// Build-only config: tells the adapter to emit its generated worker to
			// .svelte-kit/cloudflare/_worker.js (imported by src/worker.ts) instead of
			// overwriting our wrapper. See wrangler.build.jsonc for the full rationale.
			// Deploys still use wrangler.toml (main = src/worker.ts).
			config: './wrangler.build.jsonc',
			// Expose wrangler.toml bindings (R2, vars, secrets) to `vite dev` via
			// event.platform. Uses the same Miniflare state `wrangler dev` uses,
			// so `vite dev` sees whatever the cron handler wrote to R2.
			platformProxy: {
				persist: true
			}
		})
	}
};

export default config;
