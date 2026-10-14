import { error, redirect } from '@sveltejs/kit';
import {
	RWGPS_OAUTH_STATE_COOKIE,
	RWGPS_TOKEN_COOKIE,
	RWGPS_TOKEN_MAX_AGE,
	exchangeRideWithGpsCode,
	isRideWithGpsConfigured
} from '$lib/server/ridewithgps';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
	if (!platform || !isRideWithGpsConfigured(platform.env)) {
		error(500, 'Ride with GPS OAuth is not configured');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(RWGPS_OAUTH_STATE_COOKIE);
	cookies.delete(RWGPS_OAUTH_STATE_COOKIE, { path: '/' });

	// The rider declined on the consent screen: just go back to the map.
	if (url.searchParams.has('error')) redirect(302, '/');

	if (!code || !state || !storedState || state !== storedState) {
		error(400, 'Invalid OAuth state');
	}

	let token;
	try {
		token = await exchangeRideWithGpsCode(platform.env, url.origin, code);
	} catch (err) {
		error(400, err instanceof Error ? err.message : 'Ride with GPS authorization failed');
	}

	cookies.set(RWGPS_TOKEN_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: RWGPS_TOKEN_MAX_AGE
	});

	redirect(302, '/');
};
