const VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(
	token: string,
	secret: string,
	remoteip?: string
): Promise<boolean> {
	if (!token || !secret) return false;
	const body = new FormData();
	body.set('secret', secret);
	body.set('response', token);
	if (remoteip) body.set('remoteip', remoteip);
	const res = await fetch(VERIFY_ENDPOINT, { method: 'POST', body });
	if (!res.ok) return false;
	const data = (await res.json()) as { success?: boolean };
	return data.success === true;
}
