import type { R2Bucket } from '@cloudflare/workers-types';
import { ConsellDeMallorcaArcGisProvider } from '$lib/server/incidents/consell-mallorca-arcgis';
import { IncidentsProvider } from '$lib/server/incidents/provider';
import type { Incident } from '$lib/incidents';
import { CYCLING_ROADS } from '$lib/cycling-roads';
import { invalidateIncidentsCache } from '$lib/server/incidents-store';

export interface CronEnv {
	INCIDENTS: R2Bucket;
	CONSELL_POINTS_URL: string;
	CONSELL_LINES_URL: string;
}

const R2_KEY = 'incidents.json';

type ProviderReport = {
	name: string;
	status: 'ok' | 'failed';
	count?: number;
	error?: string;
};

export type CronResult = {
	ok: boolean;
	count: number;
	providers: ProviderReport[];
	generatedAt: string | null;
};

function buildProviders(env: CronEnv): IncidentsProvider[] {
	return [new ConsellDeMallorcaArcGisProvider(env.CONSELL_POINTS_URL, env.CONSELL_LINES_URL)];
}

/** Pulls from every provider, merges, and writes the result to R2. Partial-failure tolerant. */
export async function runCron(env: CronEnv): Promise<CronResult> {
	const all: Incident[] = [];
	const report: ProviderReport[] = [];
	let anySucceeded = false;

	for (const provider of buildProviders(env)) {
		try {
			const incidents = await provider.load(
				{ fetch: globalThis.fetch },
				{ roads: CYCLING_ROADS, isClosed: true }
			);
			all.push(...incidents);
			report.push({ name: provider.name, status: 'ok', count: incidents.length });
			anySucceeded = true;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`provider ${provider.name} failed:`, message);
			report.push({ name: provider.name, status: 'failed', error: message });
		}
	}

	// Keep last-known-good data if every provider failed.
	if (!anySucceeded) {
		return { ok: false, count: 0, providers: report, generatedAt: null };
	}

	const generatedAt = new Date().toISOString();
	await env.INCIDENTS.put(R2_KEY, JSON.stringify({ generatedAt, incidents: all }), {
		httpMetadata: { contentType: 'application/json; charset=utf-8' }
	});
	await invalidateIncidentsCache((caches as CacheStorage & { default: Cache }).default);
	return { ok: true, count: all.length, providers: report, generatedAt };
}
