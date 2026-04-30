export type StravaRouteSummary = {
	id: string;
	name: string;
	/** Distance in meters. */
	distance: number;
	/** Elevation gain in meters. */
	elevationGain: number;
	/** 1 = ride, 2 = run. */
	type: number;
	private: boolean;
	starred: boolean;
};

/** Extract route id from a strava.com URL (e.g. https://www.strava.com/routes/12345). */
export function parseStravaUrl(input: string): { routeId: string } | null {
	try {
		const url = new URL(input);
		if (!/(^|\.)strava\.com$/.test(url.hostname)) return null;
		const m = url.pathname.match(/\/routes\/(\d+)/);
		if (!m) return null;
		return { routeId: m[1] };
	} catch {
		return null;
	}
}

/**
 * Fetch a Strava route as GPX text directly from the browser. Strava's API
 * supports CORS for authorized requests, so the GPX can be parsed client-side.
 * The access token is obtained out-of-band (OAuth flow TBD).
 */
export async function fetchStravaRouteGpx(routeId: string, accessToken: string): Promise<string> {
	const res = await fetch(`https://www.strava.com/api/v3/routes/${routeId}/export_gpx`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!res.ok) {
		if (res.status === 401) throw new Error('Strava access token is invalid or expired');
		if (res.status === 404) throw new Error('Strava route not found or not accessible');
		throw new Error(`Strava fetch failed (${res.status})`);
	}
	return await res.text();
}

/**
 * List the authenticated athlete's cycling routes (Strava type === 1).
 * Strava paginates with `page` (1-indexed) + `per_page` (max 200); filtering
 * happens after the response, so a heavy run-route user may need pagination.
 */
export async function fetchStravaRoutes(
	athleteId: string,
	accessToken: string,
	{ page = 1, perPage = 50 }: { page?: number; perPage?: number } = {}
): Promise<StravaRouteSummary[]> {
	const url = new URL(`https://www.strava.com/api/v3/athletes/${athleteId}/routes`);
	url.searchParams.set('page', String(page));
	url.searchParams.set('per_page', String(perPage));
	const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!res.ok) {
		if (res.status === 401) throw new Error('Strava access token is invalid or expired');
		throw new Error(`Strava routes fetch failed (${res.status})`);
	}
	const raw = (await res.json()) as Array<{
		id_str?: string;
		id?: number;
		name?: string;
		distance?: number;
		elevation_gain?: number;
		type?: number;
		private?: boolean;
		starred?: boolean;
	}>;
	return raw
		.filter((r) => r.type === 1)
		.map((r) => ({
			id: r.id_str ?? String(r.id ?? ''),
			name: r.name ?? 'Untitled route',
			distance: r.distance ?? 0,
			elevationGain: r.elevation_gain ?? 0,
			type: r.type ?? 1,
			private: !!r.private,
			starred: !!r.starred
		}));
}
