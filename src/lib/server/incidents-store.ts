import type { R2Bucket } from '@cloudflare/workers-types';
import type { Incident } from '@mallorca/incidents';

const R2_KEY = 'incidents.json';

type Payload = { generatedAt: string; incidents: Incident[] };

export type IncidentsSnapshot = {
	incidents: Incident[];
	generatedAt: string | null;
};

/** Read the cron-generated incidents payload from R2 and revive Date fields. */
export async function readIncidents(bucket: R2Bucket | undefined): Promise<IncidentsSnapshot> {
	if (!bucket) return { incidents: [], generatedAt: null };

	const obj = await bucket.get(R2_KEY);
	if (!obj) return { incidents: [], generatedAt: null };

	const { incidents, generatedAt } = (await obj.json()) as Payload;
	for (const i of incidents) {
		if (i.startDate) i.startDate = new Date(i.startDate);
		if (i.endDate) i.endDate = new Date(i.endDate);
	}
	return { incidents, generatedAt };
}
