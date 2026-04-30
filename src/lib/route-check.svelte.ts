import { deserialize } from '$app/forms';
import { parseGpx, findAffectedIncidents, type ParsedGpx } from './gpx';
import { fetchStravaRouteGpx, parseStravaUrl } from './strava';
import type { Incident } from '$lib/incidents';

/**
 * Reactive checker that takes a GPX file (soon: also a remote tour URL),
 * parses it, and flags incidents that intersect the track. Expose the returned
 * object to child components via props.
 */
export function createRouteChecker(getIncidents: () => Incident[]) {
	let track = $state<ParsedGpx | null>(null);
	let affected = $state<Incident[] | null>(null);
	let error = $state<string | null>(null);
	let isProcessing = $state(false);

	const affectedIds = $derived(new Set(affected?.map((i) => i.id) ?? []));

	async function checkTrack(parsed: ParsedGpx): Promise<void> {
		// Yield once so the loader paints before we start the distance math.
		await new Promise((r) => setTimeout(r, 0));
		const hits = await findAffectedIncidents(parsed, getIncidents());
		track = parsed;
		affected = hits;
	}

	async function loadGpx(file: File): Promise<void> {
		error = null;
		track = null;
		affected = null;
		isProcessing = true;
		try {
			const text = await file.text();
			await checkTrack(parseGpx(text));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to parse GPX';
		} finally {
			isProcessing = false;
		}
	}

	async function loadKomoot(url: string, turnstileToken: string): Promise<void> {
		error = null;
		track = null;
		affected = null;
		isProcessing = true;
		try {
			const form = new FormData();
			form.set('url', url);
			form.set('cf-turnstile-response', turnstileToken);
			const res = await fetch('?/komoot', { method: 'POST', body: form });
			const result = deserialize(await res.text());
			if (result.type === 'failure') {
				error = (result.data as { error?: string } | undefined)?.error ?? 'Komoot request failed';
				return;
			}
			if (result.type !== 'success' || !result.data) {
				error = 'Unexpected response from server';
				return;
			}
			const data = result.data as { name?: string; coordinates: [number, number][] };
			await checkTrack({ name: data.name, coordinates: data.coordinates });
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load Komoot tour';
		} finally {
			isProcessing = false;
		}
	}

	async function loadStravaRouteId(routeId: string, accessToken: string): Promise<void> {
		error = null;
		track = null;
		affected = null;
		isProcessing = true;
		try {
			const gpx = await fetchStravaRouteGpx(routeId, accessToken.trim());
			await checkTrack(parseGpx(gpx));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load Strava route';
		} finally {
			isProcessing = false;
		}
	}

	async function loadStrava(url: string, accessToken: string): Promise<void> {
		const parsed = parseStravaUrl(url);
		if (!parsed) {
			error = 'Not a valid Strava route URL';
			track = null;
			affected = null;
			return;
		}
		await loadStravaRouteId(parsed.routeId, accessToken);
	}

	function clear(): void {
		track = null;
		affected = null;
		error = null;
	}

	return {
		get track() {
			return track;
		},
		get affected() {
			return affected;
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
