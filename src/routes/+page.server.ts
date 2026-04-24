import { readIncidents } from '$lib/server/incidents-store';
import { fetchKomootTour, parseKomootUrl } from '$lib/server/komoot';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	return readIncidents(platform?.env.INCIDENTS);
};

export const actions: Actions = {
	komoot: async ({ request, fetch }) => {
		const form = await request.formData();
		const url = form.get('url');
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
