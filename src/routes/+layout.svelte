<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const title = 'Mallorca Cycling Road Status';
	const description =
		"Check live road closures on Mallorca's cycling roads. Upload a GPX or paste a Komoot tour URL to see if your ride is affected.";
	const url = 'https://mallorcacyclingroads.cc/';
	const image = 'https://mallorcacyclingroads.cc/og-image.png';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="icon" href={favicon} />

	<meta property="og:type" content="website" />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={url} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>
<div
	class="flex h-dvh flex-col pb-[env(safe-area-inset-bottom)]"
	style="padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);"
>
	{@render children()}
</div>
