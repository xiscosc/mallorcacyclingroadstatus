<script lang="ts">
	import { page } from '$app/state';
	import { SITE_NAME, SITE_ORIGIN, OG_IMAGE } from '$lib/seo';
	import {
		baseLocale,
		deLocalizeUrl,
		getLocale,
		locales,
		localizeUrl
	} from '$lib/paraglide/runtime';
	import './layout.css';

	let { children } = $props();

	const OG_LOCALE: Record<string, string> = {
		en: 'en_GB',
		de: 'de_DE',
		es: 'es_ES',
		ca: 'ca_ES'
	};
	const HREFLANG: Record<string, string> = {
		en: 'en',
		de: 'de',
		es: 'es',
		ca: 'ca'
	};

	const locale = $derived(getLocale());
	const ogLocale = $derived(OG_LOCALE[locale] ?? 'en_GB');

	// Strip the locale prefix so we can re-localize for each alternate.
	const basePath = $derived(deLocalizeUrl(`${SITE_ORIGIN}${page.url.pathname}`).pathname);
	const canonical = $derived(localizeUrl(`${SITE_ORIGIN}${basePath}`, { locale }).href);
	const alternates = $derived(
		locales.map((l) => ({
			locale: l,
			href: localizeUrl(`${SITE_ORIGIN}${basePath}`, { locale: l }).href
		}))
	);
	const xDefaultHref = $derived(
		localizeUrl(`${SITE_ORIGIN}${basePath}`, { locale: baseLocale }).href
	);

	const homeUrl = $derived(localizeUrl(`${SITE_ORIGIN}/`, { locale }).href);
	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${SITE_ORIGIN}/#website`,
				url: homeUrl,
				name: SITE_NAME,
				inLanguage: locale
			},
			{
				'@type': 'WebApplication',
				'@id': `${SITE_ORIGIN}/#webapp`,
				name: SITE_NAME,
				url: homeUrl,
				applicationCategory: 'TravelApplication',
				operatingSystem: 'Any',
				browserRequirements: 'Requires JavaScript and HTML5.',
				inLanguage: locale,
				isAccessibleForFree: true,
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
				featureList: [
					'Live Mallorca road closures map',
					'GPX route upload',
					'Komoot route URL check',
					'Strava route check'
				],
				about: {
					'@type': 'Place',
					name: 'Mallorca',
					address: {
						'@type': 'PostalAddress',
						addressCountry: 'ES',
						addressRegion: 'Balearic Islands'
					}
				}
			}
		]
	});

	const jsonLdScript = $derived(
		`<script type="application/ld+json">${JSON.stringify(jsonLd)}</` + `script>`
	);
</script>

<svelte:head>
	<link rel="canonical" href={canonical} />
	{#each alternates as alt (alt.locale)}
		<link rel="alternate" hreflang={HREFLANG[alt.locale]} href={alt.href} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={xDefaultHref} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta name="theme-color" content="#0b0b0f" media="(prefers-color-scheme: dark)" />
	<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
	<meta name="apple-mobile-web-app-title" content="Mallorca Cycling" />
	<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="32x32" />
	<link rel="apple-touch-icon" href="/logo.png" />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={OG_IMAGE.url} />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content={OG_IMAGE.width} />
	<meta property="og:image:height" content={OG_IMAGE.height} />
	<meta property="og:image:alt" content={SITE_NAME} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={canonical} />
	<meta name="twitter:image" content={OG_IMAGE.url} />
	<meta name="twitter:image:alt" content={SITE_NAME} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html jsonLdScript}
</svelte:head>
<div
	class="flex min-h-dvh flex-col pb-[env(safe-area-inset-bottom)] sm:h-dvh"
	style="padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);"
>
	{@render children()}
</div>
