import type { R2Bucket } from '@cloudflare/workers-types';
import type { Incident } from '$lib/incidents';

const R2_KEY = 'incidents.json';
const CACHE_KEY = 'https://cache.internal/incidents.json';
const CACHE_TTL_SECONDS = 60 * 60;

type Payload = { generatedAt: string; incidents: Incident[] };

export type IncidentsSnapshot = {
	incidents: Incident[];
	generatedAt: string | null;
};

function revive({ incidents, generatedAt }: Payload): IncidentsSnapshot {
	for (const i of incidents) {
		if (i.startDate) i.startDate = new Date(i.startDate);
		if (i.endDate) i.endDate = new Date(i.endDate);
	}
	return { incidents, generatedAt };
}

/**
 * Read the cron-generated incidents payload from R2, cached at the edge for
 * {@link CACHE_TTL_SECONDS}. The cron invalidates the cache after each write.
 */
export async function readIncidents(
	bucket: R2Bucket | undefined,
	cache?: Cache
): Promise<IncidentsSnapshot> {
	if (!bucket) return { incidents: [], generatedAt: null };

	if (cache) {
		const hit = await cache.match(CACHE_KEY);
		if (hit) return revive((await hit.json()) as Payload);
	}

	const obj = await bucket.get(R2_KEY);
	if (!obj) return { incidents: [], generatedAt: null };

	const body = await obj.text();
	if (cache) {
		await cache.put(
			CACHE_KEY,
			new Response(body, {
				headers: {
					'content-type': 'application/json; charset=utf-8',
					'cache-control': `public, max-age=${CACHE_TTL_SECONDS}`
				}
			})
		);
	}
	return revive(JSON.parse(body) as Payload);
}

export async function invalidateIncidentsCache(cache: Cache): Promise<void> {
	await cache.delete(CACHE_KEY);
}
