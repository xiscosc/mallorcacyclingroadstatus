import { readIncidents } from '$lib/server/incidents-store';
import { fetchKomootTour, parseKomootUrl } from '$lib/server/komoot';
import { STRAVA_ATHLETE_ID_COOKIE, STRAVA_TOKEN_COOKIE } from '$lib/server/strava-oauth';
import { verifyTurnstile } from '$lib/server/turnstile';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	const incidents = await readIncidents(platform?.env.INCIDENTS, platform?.caches.default);

	let stravaToken = cookies.get(STRAVA_TOKEN_COOKIE) ?? null;
	const stravaAthleteId = cookies.get(STRAVA_ATHLETE_ID_COOKIE) ?? null;
	// A token without an athlete id is unusable (we can't list routes), so
	// drop it and force a fresh OAuth dance.
	if (stravaToken && !stravaAthleteId) {
		cookies.delete(STRAVA_TOKEN_COOKIE, { path: '/' });
		stravaToken = null;
	}

	return {
		...incidents,
		turnstileSiteKey: platform?.env.TURNSTILE_SITE_KEY ?? '',
		stravaToken,
		stravaAthleteId
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
