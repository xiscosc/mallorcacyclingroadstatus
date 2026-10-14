import { error, json } from '@sveltejs/kit';
import {
	RWGPS_TOKEN_COOKIE,
	RideWithGpsAuthError,
	fetchRideWithGpsRoute
} from '$lib/server/ridewithgps';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, cookies }) => {
	if (!/^\d+$/.test(params.id)) error(400, 'Invalid route id');
	const token = cookies.get(RWGPS_TOKEN_COOKIE);
	if (!token) error(401, 'Not connected to Ride with GPS');
	try {
		return json(await fetchRideWithGpsRoute(params.id, token));
	} catch (err) {
		if (err instanceof RideWithGpsAuthError) {
			cookies.delete(RWGPS_TOKEN_COOKIE, { path: '/' });
			error(401, err.message);
		}
		error(502, err instanceof Error ? err.message : 'Ride with GPS route fetch failed');
	}
};
