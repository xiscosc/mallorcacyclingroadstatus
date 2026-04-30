import { Strava } from 'arctic';

export const STRAVA_TOKEN_COOKIE = 'strava_token';
export const STRAVA_ATHLETE_ID_COOKIE = 'strava_athlete_id';
export const STRAVA_OAUTH_STATE_COOKIE = 'strava_oauth_state';

/**
 * `read` covers public profile/segments/routes; `read_all` is required to
 * export private routes via /routes/{id}/export_gpx.
 */
export const STRAVA_OAUTH_SCOPES = ['read', 'read_all'];

export function getStravaProvider(
	env: { STRAVA_CLIENT_ID?: string; STRAVA_CLIENT_SECRET?: string },
	origin: string
): Strava {
	if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
		throw new Error('Strava OAuth is not configured');
	}
	return new Strava(
		env.STRAVA_CLIENT_ID,
		env.STRAVA_CLIENT_SECRET,
		`${origin}/auth/strava/callback`
	);
}
