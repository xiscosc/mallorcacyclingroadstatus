import { SITE_ORIGIN } from '$lib/seo';
import { baseLocale, locales, localizeUrl } from '$lib/paraglide/runtime';
import type { RequestHandler } from './$types';

const ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
	{ path: '/', changefreq: 'hourly', priority: '1.0' },
	{ path: '/support', changefreq: 'monthly', priority: '0.5' }
];

export const GET: RequestHandler = async () => {
	const lastmod = new Date().toISOString().split('T')[0];

	const urls = ROUTES.flatMap(({ path, changefreq, priority }) => {
		return locales.map((locale) => {
			const loc = localizeUrl(`${SITE_ORIGIN}${path}`, { locale }).href;
			const alternates = locales
				.map(
					(l) =>
						`		<xhtml:link rel="alternate" hreflang="${l}" href="${localizeUrl(`${SITE_ORIGIN}${path}`, { locale: l }).href}" />`
				)
				.join('\n');
			const xDefault = `		<xhtml:link rel="alternate" hreflang="x-default" href="${localizeUrl(`${SITE_ORIGIN}${path}`, { locale: baseLocale }).href}" />`;
			return `	<url>
		<loc>${loc}</loc>
		<lastmod>${lastmod}</lastmod>
		<changefreq>${changefreq}</changefreq>
		<priority>${priority}</priority>
${alternates}
${xDefault}
	</url>`;
		});
	}).join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
