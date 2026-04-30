import { generateState } from 'arctic';
import { error, redirect } from '@sveltejs/kit';
import {
	STRAVA_OAUTH_SCOPES,
	STRAVA_OAUTH_STATE_COOKIE,
	getStravaProvider
} from '$lib/server/strava-oauth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, cookies, platform }) => {
	if (!platform?.env.STRAVA_CLIENT_ID || !platform?.env.STRAVA_CLIENT_SECRET) {
		error(500, 'Strava OAuth is not configured');
	}
	const strava = getStravaProvider(platform.env, url.origin);
	const state = generateState();
	cookies.set(STRAVA_OAUTH_STATE_COOKIE, state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: 60 * 10
	});
	const authUrl = strava.createAuthorizationURL(state, STRAVA_OAUTH_SCOPES);
	redirect(302, authUrl.toString());
};
