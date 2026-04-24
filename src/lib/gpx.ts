import { gpx as gpxToGeoJson } from '@tmcw/togeojson';
import pointToLineDistance from '@turf/point-to-line-distance';
import { lineString } from '@turf/helpers';
import type { Incident } from '$lib/incidents';

export type ParsedGpx = {
	name?: string;
	/** Track points as [lng, lat]. */
	coordinates: [number, number][];
};

type Bbox = [number, number, number, number]; // [minX, minY, maxX, maxY]

/** Parse the raw text of a GPX file into a flat list of track points. */
export function parseGpx(text: string): ParsedGpx {
	const doc = new DOMParser().parseFromString(text, 'application/xml');
	if (doc.querySelector('parsererror')) {
		throw new Error('Invalid GPX: XML parse error');
	}
	const fc = gpxToGeoJson(doc);
	const coords: [number, number][] = [];
	let name: string | undefined;
	for (const f of fc.features) {
		if (!name && typeof f.properties?.name === 'string') name = f.properties.name;
		const g = f.geometry;
		if (!g) continue;
		if (g.type === 'LineString') {
			for (const c of g.coordinates) coords.push([c[0], c[1]]);
		} else if (g.type === 'MultiLineString') {
			for (const line of g.coordinates) for (const c of line) coords.push([c[0], c[1]]);
		}
	}
	if (coords.length < 2) throw new Error('GPX contains no track points');
	return { name, coordinates: coords };
}

function bboxOf(coords: [number, number][]): Bbox {
	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity;
	for (const [x, y] of coords) {
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	}
	return [minX, minY, maxX, maxY];
}

function bboxOverlaps(a: Bbox, b: Bbox, padDeg: number): boolean {
	return (
		a[0] - padDeg <= b[2] &&
		a[2] + padDeg >= b[0] &&
		a[1] - padDeg <= b[3] &&
		a[3] + padDeg >= b[1]
	);
}

function isIncidentAffected(
	track: ParsedGpx,
	incident: Incident,
	trackBbox: Bbox,
	padDeg: number,
	toleranceMeters: number
): boolean {
	const allPoints = incident.coordinates.flat();
	if (allPoints.length < 2) return false;
	if (!bboxOverlaps(trackBbox, bboxOf(allPoints), padDeg)) return false;
	for (const line of incident.coordinates) {
		if (line.length < 2) continue;
		const ls = lineString(line);
		for (const pt of track.coordinates) {
			const d = pointToLineDistance(pt, ls, { units: 'meters' });
			if (d <= toleranceMeters) return true;
		}
	}
	return false;
}

/**
 * Return the subset of `incidents` whose geometry comes within `toleranceMeters`
 * of the GPX track. Yields to the event loop between chunks so the UI can paint
 * (keeps spinners animating on the main thread).
 */
export async function findAffectedIncidents(
	track: ParsedGpx,
	incidents: Incident[],
	toleranceMeters = 25,
	chunkSize = 10
): Promise<Incident[]> {
	if (track.coordinates.length < 2) return [];
	const trackBbox = bboxOf(track.coordinates);
	// Rough degrees-per-meter at mid-latitudes: 1° latitude ≈ 111 km.
	const padDeg = toleranceMeters / 111000 + 0.0005;

	const affected: Incident[] = [];
	for (let i = 0; i < incidents.length; i++) {
		if (isIncidentAffected(track, incidents[i], trackBbox, padDeg, toleranceMeters)) {
			affected.push(incidents[i]);
		}
		if ((i + 1) % chunkSize === 0) {
			await new Promise((r) => setTimeout(r, 0));
		}
	}
	return affected;
}
