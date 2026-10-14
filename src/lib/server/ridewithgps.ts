/**
 * Ride with GPS OAuth + API (v1). Docs: https://ridewithgps.com/api
 *
 * The token stays server-side in an httpOnly cookie; the browser only talks to
 * our `/api/ridewithgps/*` proxy endpoints.
 */

import type { RideWithGpsRouteSummary } from '$lib/ridewithgps';

export const RWGPS_TOKEN_COOKIE = 'rwgps_token';
export const RWGPS_OAUTH_STATE_COOKIE = 'rwgps_oauth_state';

/**
 * The token response carries no `expires_in` and no refresh token, so there is
 * no expiry to mirror. Keep the cookie for 30 days; a revoked token surfaces as
 * a 401 and drops the cookie (see `RideWithGpsAuthError`).
 */
export const RWGPS_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

const BASE = 'https://ridewithgps.com';

type RideWithGpsEnv = { RWGPS_CLIENT_ID?: string; RWGPS_CLIENT_SECRET?: string };

export type RideWithGpsRoute = {
	name?: string;
	/** Track points as [lng, lat]. */
	coordinates: [number, number][];
};

/** The token was rejected (revoked or invalid): the caller should drop the cookie. */
export class RideWithGpsAuthError extends Error {}

export function isRideWithGpsConfigured(env: RideWithGpsEnv | undefined): boolean {
	return !!env?.RWGPS_CLIENT_ID && !!env?.RWGPS_CLIENT_SECRET;
}

export function rideWithGpsRedirectUri(origin: string): string {
	return `${origin}/auth/ridewithgps/callback`;
}

export function rideWithGpsAuthorizationUrl(
	env: RideWithGpsEnv,
	origin: string,
	state: string
): URL {
	if (!env.RWGPS_CLIENT_ID) throw new Error('Ride with GPS OAuth is not configured');
	const url = new URL(`${BASE}/oauth/authorize`);
	url.searchParams.set('client_id', env.RWGPS_CLIENT_ID);
	url.searchParams.set('redirect_uri', rideWithGpsRedirectUri(origin));
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('state', state);
	return url;
}

/** Exchange the access grant for an access token. The endpoint takes a JSON body. */
export async function exchangeRideWithGpsCode(
	env: RideWithGpsEnv,
	origin: string,
	code: string
): Promise<string> {
	if (!env.RWGPS_CLIENT_ID || !env.RWGPS_CLIENT_SECRET) {
		throw new Error('Ride with GPS OAuth is not configured');
	}
	const res = await fetch(`${BASE}/oauth/token.json`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({
			grant_type: 'authorization_code',
			code,
			client_id: env.RWGPS_CLIENT_ID,
			client_secret: env.RWGPS_CLIENT_SECRET,
			redirect_uri: rideWithGpsRedirectUri(origin)
		})
	});
	if (!res.ok) throw new Error(`Ride with GPS token exchange failed (${res.status})`);
	const data = (await res.json()) as { access_token?: unknown };
	if (typeof data.access_token !== 'string' || !data.access_token) {
		throw new Error('Ride with GPS token response has no access_token');
	}
	return data.access_token;
}

/** Best effort: the cookie is dropped either way. */
export async function revokeRideWithGpsToken(env: RideWithGpsEnv, token: string): Promise<void> {
	if (!env.RWGPS_CLIENT_ID || !env.RWGPS_CLIENT_SECRET) return;
	await fetch(`${BASE}/oauth/revoke.json`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({
			client_id: env.RWGPS_CLIENT_ID,
			client_secret: env.RWGPS_CLIENT_SECRET,
			token
		})
	});
}

async function apiGet(path: string, token: string): Promise<Response> {
	const res = await fetch(`${BASE}${path}`, {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
	});
	if (res.status === 401) throw new RideWithGpsAuthError('Ride with GPS session expired');
	return res;
}

/**
 * The authenticated user's own routes, most recently updated first. The API
 * only lists owned routes; saved/pinned routes of other users don't show up.
 * Page sizes must be between 20 and 200.
 */
export async function fetchRideWithGpsRoutes(token: string): Promise<RideWithGpsRouteSummary[]> {
	const res = await apiGet('/api/v1/routes.json?page=1&page_size=100', token);
	if (!res.ok) throw new Error(`Ride with GPS routes fetch failed (${res.status})`);
	const data = (await res.json()) as {
		routes?: Array<{
			id?: number;
			name?: string;
			distance?: number;
			elevation_gain?: number;
			visibility?: string;
		}>;
	};
	return (data.routes ?? [])
		.filter((r) => typeof r.id === 'number')
		.map((r) => ({
			id: String(r.id),
			name: r.name || 'Untitled route',
			distance: r.distance ?? 0,
			elevationGain: r.elevation_gain ?? 0,
			private: !!r.visibility && r.visibility !== 'public'
		}));
}

/** Any route the authenticated user may view (own, or someone else's public route). */
export async function fetchRideWithGpsRoute(
	routeId: string,
	token: string
): Promise<RideWithGpsRoute> {
	const res = await apiGet(`/api/v1/routes/${encodeURIComponent(routeId)}.json`, token);
	if (res.status === 403) throw new Error('This Ride with GPS route is private');
	if (res.status === 404) throw new Error('Ride with GPS route not found');
	if (!res.ok) throw new Error(`Ride with GPS route fetch failed (${res.status})`);
	const data = (await res.json()) as {
		route?: { name?: unknown; track_points?: Array<{ x?: number; y?: number }> };
	};
	const coordinates: [number, number][] = (data.route?.track_points ?? [])
		.filter((p) => typeof p.x === 'number' && typeof p.y === 'number')
		.map((p) => [p.x as number, p.y as number]);
	if (coordinates.length < 2) throw new Error('Route has no track points');
	const name = typeof data.route?.name === 'string' ? data.route.name : undefined;
	return { name, coordinates };
}
