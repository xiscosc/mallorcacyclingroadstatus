import { deserialize } from '$app/forms';
import { parseGpx, findAffectedIncidents, type ParsedGpx } from './gpx';
import { fetchStravaRouteGpx, parseStravaUrl } from './strava';
import { isBusOnlyClosure } from './cycling-roads';
import { IncidentType, type Incident } from '$lib/incidents';
import { m } from '$lib/paraglide/messages';

/**
 * Reactive checker that takes a GPX file (soon: also a remote tour URL),
 * parses it, and flags incidents that intersect the track. Expose the returned
 * object to child components via props.
 */
export function createRouteChecker(getIncidents: () => Incident[]) {
	let track = $state<ParsedGpx | null>(null);
	let affected = $state<Incident[] | null>(null);
	let busOnly = $state<Incident[] | null>(null);
	let eclipse = $state<Incident[] | null>(null);
	let error = $state<string | null>(null);
	let isProcessing = $state(false);

	const affectedIds = $derived(
		new Set([
			...(affected?.map((i) => i.id) ?? []),
			...(busOnly?.map((i) => i.id) ?? []),
			...(eclipse?.map((i) => i.id) ?? [])
		])
	);

	const isEclipse = (i: Incident) => i.type === IncidentType.Eclipse;

	async function checkTrack(parsed: ParsedGpx): Promise<void> {
		// Yield once so the loader paints before we start the distance math.
		await new Promise((r) => setTimeout(r, 0));
		const hits = await findAffectedIncidents(parsed, getIncidents());
		track = parsed;
		// Bus-only and eclipse restrictions get their own note in the banner: they are
		// not route blockers for a cyclist, so they stay out of `affected`.
		busOnly = hits.filter(isBusOnlyClosure);
		eclipse = hits.filter(isEclipse);
		affected = hits.filter((h) => !isBusOnlyClosure(h) && !isEclipse(h));
	}

	async function loadGpx(file: File): Promise<void> {
		error = null;
		track = null;
		affected = null;
		busOnly = null;
		eclipse = null;
		isProcessing = true;
		try {
			const text = await file.text();
			await checkTrack(parseGpx(text));
		} catch (err) {
			error = err instanceof Error ? err.message : m.error_failed_parse_gpx();
		} finally {
			isProcessing = false;
		}
	}

	async function loadKomoot(url: string, turnstileToken: string): Promise<void> {
		error = null;
		track = null;
		affected = null;
		busOnly = null;
		eclipse = null;
		isProcessing = true;
		try {
			const form = new FormData();
			form.set('url', url);
			form.set('cf-turnstile-response', turnstileToken);
			const res = await fetch('?/komoot', { method: 'POST', body: form });
			const result = deserialize(await res.text());
			if (result.type === 'failure') {
				error =
					(result.data as { error?: string } | undefined)?.error ?? m.error_komoot_request_failed();
				return;
			}
			if (result.type !== 'success' || !result.data) {
				error = m.error_unexpected_response();
				return;
			}
			const data = result.data as { name?: string; coordinates: [number, number][] };
			await checkTrack({ name: data.name, coordinates: data.coordinates });
		} catch (err) {
			error = err instanceof Error ? err.message : m.error_failed_load_komoot();
		} finally {
			isProcessing = false;
		}
	}

	async function loadStravaRouteId(routeId: string, accessToken: string): Promise<void> {
		error = null;
		track = null;
		affected = null;
		busOnly = null;
		eclipse = null;
		isProcessing = true;
		try {
			const gpx = await fetchStravaRouteGpx(routeId, accessToken.trim());
			await checkTrack(parseGpx(gpx));
		} catch (err) {
			error = err instanceof Error ? err.message : m.error_failed_load_strava();
		} finally {
			isProcessing = false;
		}
	}

	async function loadStrava(url: string, accessToken: string): Promise<void> {
		const parsed = parseStravaUrl(url);
		if (!parsed) {
			error = m.error_invalid_strava_url();
			track = null;
			affected = null;
			busOnly = null;
			eclipse = null;
			return;
		}
		await loadStravaRouteId(parsed.routeId, accessToken);
	}

	function clear(): void {
		track = null;
		affected = null;
		busOnly = null;
		eclipse = null;
		error = null;
	}

	return {
		get track() {
			return track;
		},
		get affected() {
			return affected;
		},
		get busOnly() {
			return busOnly;
		},
		get eclipse() {
			return eclipse;
		},
		get error() {
			return error;
		},
		get isProcessing() {
			return isProcessing;
		},
		get affectedIds() {
			return affectedIds;
		},
		loadGpx,
		loadKomoot,
		loadStrava,
		loadStravaRouteId,
		clear
	};
}

export type RouteChecker = ReturnType<typeof createRouteChecker>;
