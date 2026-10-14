import { generateState } from 'arctic';
import { error, redirect } from '@sveltejs/kit';
import {
	RWGPS_OAUTH_STATE_COOKIE,
	isRideWithGpsConfigured,
	rideWithGpsAuthorizationUrl
} from '$lib/server/ridewithgps';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, cookies, platform }) => {
	if (!platform || !isRideWithGpsConfigured(platform.env)) {
		error(500, 'Ride with GPS OAuth is not configured');
	}
	const state = generateState();
	cookies.set(RWGPS_OAUTH_STATE_COOKIE, state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: 60 * 10
	});
	redirect(302, rideWithGpsAuthorizationUrl(platform.env, url.origin, state).toString());
};
