// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface TurnstileWidget {
		render: (
			el: HTMLElement,
			opts: {
				sitekey: string;
				callback?: (token: string) => void;
				'expired-callback'?: () => void;
				'error-callback'?: () => void;
				theme?: 'light' | 'dark' | 'auto';
				appearance?: 'always' | 'execute' | 'interaction-only';
			}
		) => string;
		remove: (id: string) => void;
		reset: (id: string) => void;
	}
	interface Window {
		turnstile?: TurnstileWidget;
	}
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				INCIDENTS: R2Bucket;
				CONSELL_POINTS_URL: string;
				CONSELL_LINES_URL: string;
				TURNSTILE_SITE_KEY: string;
				TURNSTILE_SECRET: string;
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
