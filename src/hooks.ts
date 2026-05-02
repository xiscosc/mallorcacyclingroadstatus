import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

// Paths that must always resolve to a single canonical URL (no locale prefix).
// /es/sitemap.xml etc. should 404 — only /sitemap.xml is valid.
const NON_LOCALIZED = /^(?:\/(?:de|es|ca))?\/(?:sitemap\.xml|robots\.txt)$/;

export const reroute: Reroute = ({ url }) => {
	if (NON_LOCALIZED.test(url.pathname)) return;
	return deLocalizeUrl(url).pathname;
};
