/**
 * Share links carry the whole route in the URL (nothing is stored server-side):
 * `?r=<route>&n=<name>&d=<yyyy-MM-dd>`. The route is simplified, then written as a
 * Google encoded polyline (precision 5, ~1 m).
 */

type LngLat = [number, number];

// Polyline chunks are 6-bit values (shifted by 63 in the classic format). Writing them in the
// base64url alphabet instead keeps the param free of characters that need percent-escaping.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Simplification tolerance: well inside the route checker's 25 m. */
const SIMPLIFY_M = 10;
/** Shared routes are refilled to this spacing before checking (see `densify`). */
export const DENSIFY_M = 20;
/** Upper bound on decoded points, so a crafted URL can't make the server or client grind. */
const MAX_POINTS = 5000;
const MAX_NAME = 80;

export type SharedRoute = { name?: string; coordinates: LngLat[]; date: string };

export function shareParams(route: { name?: string; coordinates: LngLat[] }, date: string) {
	const params = new URLSearchParams({ r: encodeRoute(simplify(route.coordinates, SIMPLIFY_M)) });
	const name = route.name?.trim().slice(0, MAX_NAME);
	if (name) params.set('n', name);
	if (date) params.set('d', date);
	return params;
}

/** Reads a share link's params; null when there is no route or it is malformed. */
export function readShare(params: URLSearchParams): SharedRoute | null {
	const r = params.get('r');
	const coordinates = r ? decodeRoute(r) : null;
	if (!coordinates || coordinates.length < 2) return null;
	const date = params.get('d') ?? '';
	return {
		name: params.get('n')?.trim().slice(0, MAX_NAME) || undefined,
		coordinates,
		date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''
	};
}

export function encodeRoute(coords: LngLat[]): string {
	let out = '';
	let prevLat = 0;
	let prevLng = 0;
	for (const [lng, lat] of coords) {
		const la = Math.round(lat * 1e5);
		const lo = Math.round(lng * 1e5);
		out += encodeValue(la - prevLat) + encodeValue(lo - prevLng);
		prevLat = la;
		prevLng = lo;
	}
	return out;
}

function encodeValue(n: number): string {
	let v = n < 0 ? ~(n << 1) : n << 1;
	let s = '';
	while (v >= 0x20) {
		s += ALPHABET[0x20 | (v & 0x1f)];
		v >>= 5;
	}
	return s + ALPHABET[v];
}

export function decodeRoute(str: string): LngLat[] | null {
	const coords: LngLat[] = [];
	let i = 0;
	let lat = 0;
	let lng = 0;
	const next = (): number | null => {
		let result = 0;
		for (let shift = 0; shift <= 30; shift += 5) {
			const b = ALPHABET.indexOf(str[i++] ?? '');
			if (b < 0) return null;
			result |= (b & 0x1f) << shift;
			if (b < 0x20) return result & 1 ? ~(result >> 1) : result >> 1;
		}
		return null;
	};
	while (i < str.length) {
		const dLat = next();
		const dLng = next();
		if (dLat === null || dLng === null || coords.length >= MAX_POINTS) return null;
		lat += dLat;
		lng += dLng;
		coords.push([lng / 1e5, lat / 1e5]);
	}
	return coords;
}

/** Local metres around Mallorca: plenty accurate at island scale. */
const toXY = ([lng, lat]: LngLat): LngLat => [
	lng * 111_320 * Math.cos((39.6 * Math.PI) / 180),
	lat * 110_540
];

/** Douglas–Peucker: drops points that stay within `tolerance` metres of the simplified line. */
export function simplify(coords: LngLat[], tolerance: number): LngLat[] {
	if (coords.length < 3) return coords;
	const xy = coords.map(toXY);
	const keep = new Uint8Array(coords.length);
	keep[0] = keep[coords.length - 1] = 1;
	const stack: [number, number][] = [[0, coords.length - 1]];
	while (stack.length) {
		const [a, b] = stack.pop()!;
		let maxD = 0;
		let idx = -1;
		for (let i = a + 1; i < b; i++) {
			const d = segmentDistance(xy[i], xy[a], xy[b]);
			if (d > maxD) [maxD, idx] = [d, i];
		}
		if (maxD > tolerance) {
			keep[idx] = 1;
			stack.push([a, idx], [idx, b]);
		}
	}
	return coords.filter((_, i) => keep[i]);
}

function segmentDistance([px, py]: LngLat, [ax, ay]: LngLat, [bx, by]: LngLat): number {
	const dx = bx - ax;
	const dy = by - ay;
	const len2 = dx * dx + dy * dy;
	const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
	return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/**
 * Adds points so none are more than `step` metres apart. The route checker measures from track
 * points, so the long straight segments simplification leaves could otherwise skip a closure.
 */
export function densify(coords: LngLat[], step: number): LngLat[] {
	const out: LngLat[] = [];
	for (let i = 0; i < coords.length - 1; i++) {
		const [a, b] = [coords[i], coords[i + 1]];
		const [ax, ay] = toXY(a);
		const [bx, by] = toXY(b);
		const n = Math.ceil(Math.hypot(bx - ax, by - ay) / step);
		for (let k = 0; k < n; k++)
			out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
	}
	if (coords.length) out.push(coords[coords.length - 1]);
	return out;
}
