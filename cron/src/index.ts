import {
	ConsellDeMallorcaRoadsProvider,
	type Incident,
	type IncidentsProvider
} from '@mallorca/incidents';
import { CYCLING_ROADS } from './cycling-roads';

export interface Env {
	INCIDENTS: R2Bucket;
	CONSELL_POINTS_URL: string;
	CONSELL_LINES_URL: string;
}

const R2_KEY = 'incidents.json';

function buildProviders(env: Env): IncidentsProvider[] {
	return [new ConsellDeMallorcaRoadsProvider(env.CONSELL_POINTS_URL, env.CONSELL_LINES_URL)];
}

type ProviderReport = {
	name: string;
	status: 'ok' | 'failed';
	count?: number;
	error?: string;
};

type GenerationResult = {
	ok: boolean;
	count: number;
	providers: ProviderReport[];
	generatedAt: string | null;
};

async function generateAndStore(env: Env): Promise<GenerationResult> {
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

	// Every provider failed — keep whatever R2 already has instead of overwriting with empty.
	if (!anySucceeded) {
		return { ok: false, count: 0, providers: report, generatedAt: null };
	}

	const generatedAt = new Date().toISOString();
	await env.INCIDENTS.put(R2_KEY, JSON.stringify({ generatedAt, incidents: all }), {
		httpMetadata: { contentType: 'application/json; charset=utf-8' }
	});

	return { ok: true, count: all.length, providers: report, generatedAt };
}

export default {
	async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(
			generateAndStore(env).then((r) => console.log('cron run:', JSON.stringify(r)))
		);
	},
	async fetch(_req, env) {
		const result = await generateAndStore(env);
		return new Response(JSON.stringify(result, null, 2), {
			status: result.ok ? 200 : 502,
			headers: { 'content-type': 'application/json; charset=utf-8' }
		});
	}
} satisfies ExportedHandler<Env>;
