import proj4 from 'proj4';
import type { Incident, LoadOptions, ProviderContext } from '$lib/incidents';

export type { Incident, LoadOptions, ProviderContext } from '$lib/incidents';
export { IncidentType } from '$lib/incidents';

const UTM_31N = '+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs';

/**
 * Base class for any source that yields road incidents. Subclass and implement `load`.
 * Shared parse/reproject helpers live here so subclasses stay short.
 */
export abstract class IncidentsProvider {
	/** Stable short identifier — used to distinguish multiple incident sources. */
	abstract readonly name: string;

	/** Human-readable source name shown to users, e.g. "Consell de Mallorca". */
	abstract readonly displayName: string;

	abstract load(ctx: ProviderContext, options?: LoadOptions): Promise<Incident[]>;

	/** Strip a JSONP callback wrapper (`cb({...})`) and return the parsed inner JSON. */
	protected parseJsonp<T>(text: string): T {
		const open = text.indexOf('(');
		const close = text.lastIndexOf(')');
		if (open === -1 || close <= open) {
			throw new Error(`${this.name}: not a JSONP payload`);
		}
		return JSON.parse(text.slice(open + 1, close)) as T;
	}

	/** Convert a UTM Zone 31N (meters) coordinate to WGS84 [lng, lat] (degrees). */
	protected utm31nToLngLat([x, y]: [number, number]): [number, number] {
		const [lng, lat] = proj4(UTM_31N, 'WGS84', [x, y]);
		return [lng, lat];
	}
}
