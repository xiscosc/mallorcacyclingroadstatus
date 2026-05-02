import { SITE_ORIGIN } from '$lib/seo';
import type { RequestHandler } from './$types';

const ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
	{ path: '/', changefreq: 'hourly', priority: '1.0' },
	{ path: '/support', changefreq: 'monthly', priority: '0.5' }
];

export const GET: RequestHandler = async () => {
	const lastmod = new Date().toISOString().split('T')[0];
	const urls = ROUTES.map(
		({ path, changefreq, priority }) => `	<url>
		<loc>${SITE_ORIGIN}${path}</loc>
		<lastmod>${lastmod}</lastmod>
		<changefreq>${changefreq}</changefreq>
		<priority>${priority}</priority>
	</url>`
	).join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
