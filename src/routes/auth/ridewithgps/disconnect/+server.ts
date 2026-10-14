import { json } from '@sveltejs/kit';
import { RWGPS_TOKEN_COOKIE, revokeRideWithGpsToken } from '$lib/server/ridewithgps';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, platform }) => {
	const token = cookies.get(RWGPS_TOKEN_COOKIE);
	cookies.delete(RWGPS_TOKEN_COOKIE, { path: '/' });
	if (token && platform) {
		try {
			await revokeRideWithGpsToken(platform.env, token);
		} catch {
			// The cookie is gone either way; a failed revoke only leaves the grant listed on RWGPS.
		}
	}
	return json({ ok: true });
};
