import { OAuth2RequestError } from 'arctic';
import { error, redirect } from '@sveltejs/kit';
import {
	STRAVA_ATHLETE_ID_COOKIE,
	STRAVA_OAUTH_STATE_COOKIE,
	STRAVA_TOKEN_COOKIE,
	getStravaProvider
} from '$lib/server/strava-oauth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
	if (!platform?.env.STRAVA_CLIENT_ID || !platform?.env.STRAVA_CLIENT_SECRET) {
		error(500, 'Strava OAuth is not configured');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(STRAVA_OAUTH_STATE_COOKIE);
	cookies.delete(STRAVA_OAUTH_STATE_COOKIE, { path: '/' });

	if (!code || !state || !storedState || state !== storedState) {
		error(400, 'Invalid OAuth state');
	}

	const strava = getStravaProvider(platform.env, url.origin);

	let tokens;
	try {
		tokens = await strava.validateAuthorizationCode(code);
	} catch (err) {
		if (err instanceof OAuth2RequestError) {
			error(400, `Strava authorization failed: ${err.description ?? err.message}`);
		}
		throw err;
	}

	// Strava access tokens are valid ~6h. Set the cookie to expire ~1 minute
	// before the token does so we never hand out a token that's about to die.
	const expiresAt = tokens.accessTokenExpiresAt();
	const maxAge = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000) - 60);
	const cookieOpts = {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge
	} as const;
	cookies.set(STRAVA_TOKEN_COOKIE, tokens.accessToken(), cookieOpts);

	// Strava's token response includes the athlete object; pull the id so the
	// frontend can list routes without an extra /athlete round-trip.
	const data = tokens.data as { athlete?: { id?: number } };
	const athleteId = data.athlete?.id;
	if (typeof athleteId === 'number') {
		cookies.set(STRAVA_ATHLETE_ID_COOKIE, String(athleteId), cookieOpts);
	}

	redirect(302, '/');
};
