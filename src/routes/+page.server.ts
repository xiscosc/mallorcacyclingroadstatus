import { readIncidents } from '$lib/server/incidents-store';
import { fetchKomootTour, parseKomootUrl } from '$lib/server/komoot';
import { verifyTurnstile } from '$lib/server/turnstile';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const incidents = await readIncidents(platform?.env.INCIDENTS, platform?.caches.default);
	return {
		...incidents,
		turnstileSiteKey: platform?.env.TURNSTILE_SITE_KEY ?? ''
	};
};

export const actions: Actions = {
	komoot: async ({ request, fetch, platform, getClientAddress }) => {
		const form = await request.formData();
		const url = form.get('url');
		const token = form.get('cf-turnstile-response');
		if (typeof token !== 'string' || !token) {
			return fail(400, { error: 'Captcha required' });
		}
		const secret = platform?.env.TURNSTILE_SECRET;
		if (!secret) return fail(500, { error: 'Captcha not configured' });
		const ok = await verifyTurnstile(token, secret, getClientAddress());
		if (!ok) return fail(403, { error: 'Captcha verification failed' });
		if (typeof url !== 'string' || !url.trim()) {
			return fail(400, { error: 'Missing URL' });
		}
		const parsed = parseKomootUrl(url);
		if (!parsed) return fail(400, { error: 'Not a valid Komoot tour URL' });
		try {
			const tour = await fetchKomootTour(parsed.tourId, parsed.shareToken, { fetch });
			return { name: tour.name, coordinates: tour.coordinates };
		} catch (err) {
			return fail(502, { error: err instanceof Error ? err.message : 'Komoot fetch failed' });
		}
	}
};
