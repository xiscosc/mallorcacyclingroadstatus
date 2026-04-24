export type KomootTour = {
	name?: string;
	/** Track points as [lng, lat]. */
	coordinates: [number, number][];
};

export type KomootContext = {
	fetch: typeof globalThis.fetch;
};

/** Extract tour id + optional share token from a komoot.com URL. */
export function parseKomootUrl(
	input: string
): { tourId: string; shareToken: string | null } | null {
	try {
		const url = new URL(input);
		if (!/(^|\.)komoot\.(com|de)$/.test(url.hostname)) return null;
		const m = url.pathname.match(/\/tour\/(\d+)/);
		if (!m) return null;
		return {
			tourId: m[1],
			shareToken: url.searchParams.get('share_token')
		};
	} catch {
		return null;
	}
}

/**
 * Fetch a Komoot tour's metadata + coordinate stream. CORS-blocked in browsers,
 * so callers must run this server-side.
 */
export async function fetchKomootTour(
	tourId: string,
	shareToken: string | null,
	ctx: KomootContext
): Promise<KomootTour> {
	const q = shareToken ? `?share_token=${encodeURIComponent(shareToken)}` : '';
	const metaUrl = `https://www.komoot.com/api/v007/tours/${tourId}${q}`;
	const coordsUrl = `https://www.komoot.com/api/v007/tours/${tourId}/coordinates${q}`;

	const [metaRes, coordsRes] = await Promise.all([ctx.fetch(metaUrl), ctx.fetch(coordsUrl)]);
	if (!metaRes.ok) throw new Error(`Komoot meta fetch failed (${metaRes.status})`);
	if (!coordsRes.ok) throw new Error(`Komoot coordinates fetch failed (${coordsRes.status})`);

	const meta = (await metaRes.json()) as { name?: unknown };
	const coords = (await coordsRes.json()) as { items?: Array<{ lat: number; lng: number }> };

	const items = coords.items ?? [];
	const coordinates: [number, number][] = items.map((p) => [p.lng, p.lat]);
	if (coordinates.length < 2) throw new Error('Tour has no track points');
	const name = typeof meta?.name === 'string' ? meta.name : undefined;
	return { name, coordinates };
}
