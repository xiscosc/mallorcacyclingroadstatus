import { error, json } from '@sveltejs/kit';
import {
	RWGPS_TOKEN_COOKIE,
	RideWithGpsAuthError,
	fetchRideWithGpsRoutes
} from '$lib/server/ridewithgps';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get(RWGPS_TOKEN_COOKIE);
	if (!token) error(401, 'Not connected to Ride with GPS');
	try {
		return json(await fetchRideWithGpsRoutes(token));
	} catch (err) {
		if (err instanceof RideWithGpsAuthError) {
			cookies.delete(RWGPS_TOKEN_COOKIE, { path: '/' });
			error(401, err.message);
		}
		error(502, err instanceof Error ? err.message : 'Ride with GPS routes fetch failed');
	}
};
