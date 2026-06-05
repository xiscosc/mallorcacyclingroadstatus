<script lang="ts">
	import {
		Map,
		MapControls,
		MapRoute,
		MapMarker,
		MarkerContent,
		MarkerTooltip
	} from '$lib/components/ui/map';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { IncidentType } from '$lib/incidents';
	import { isBusOnlyClosure } from '$lib/cycling-roads';
	import { theme, toggleTheme } from '$lib/theme';
	import { createRouteChecker } from '$lib/route-check.svelte';
	import RouteCheckMenu from '$lib/components/route-check-menu.svelte';
	import RouteCheckBanner from '$lib/components/route-check-banner.svelte';
	import LanguageSwitcher from '$lib/components/language-switcher.svelte';
	import { DateTime } from 'luxon';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Mail from '@lucide/svelte/icons/mail';
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const incidents = $derived.by(() => {
		const now = Date.now();
		return data.incidents.filter((i) => !i.endDate || i.endDate.getTime() >= now);
	});

	const checker = createRouteChecker(() => incidents);

	// Framed to show the whole island on both phone and desktop aspect ratios.
	const initialZoom = browser && window.matchMedia('(max-width: 640px)').matches ? 8.3 : 9.2;

	const fmtDate = (d: Date | undefined) =>
		d ? DateTime.fromJSDate(d).setZone('Europe/Madrid').toFormat('dd LLL HH:mm') : '—';

	const fmtUpdatedAt = (iso: string) =>
		DateTime.fromISO(iso).setZone('Europe/Madrid').toFormat('dd LLL HH:mm');

	const EMOJI: Record<IncidentType, string> = {
		[IncidentType.Sports]: '🏅',
		[IncidentType.Maintenance]: '🚧',
		[IncidentType.Other]: '⚠️'
	};

	const pageTitle = $derived(m.page_title());
	const pageDescription = $derived(m.page_description());

	const hasBusOnly = $derived(incidents.some(isBusOnlyClosure));
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
</svelte:head>

<main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
	<section
		class="relative overflow-hidden rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<div class="pointer-events-none absolute inset-x-0 top-0 flex h-1">
			<span class="flex-1 bg-[#319151]"></span>
			<span class="flex-1 bg-[#f3931a]"></span>
			<span class="flex-1 bg-[#da272c]"></span>
		</div>

		<div class="relative flex items-start justify-between gap-3">
			<div class="flex min-w-0 flex-col gap-3">
				<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					{m.home_heading()}
				</h1>
				<p class="max-w-prose text-muted-foreground">
					{#if incidents.length === 0}
						{m.home_no_closures()}
					{:else}
						<span class="font-medium text-foreground">{incidents.length}</span>
						{incidents.length === 1 ? m.home_closures_one() : m.home_closures_other()}
					{/if}
					{m.home_intro()}
				</p>
			</div>
			<div class="flex shrink-0 items-center gap-1">
				<LanguageSwitcher />
				<Button
					variant="ghost"
					size="icon-lg"
					onclick={toggleTheme}
					aria-label={m.toggle_theme()}
					class="shrink-0"
				>
					{#if $theme === 'dark'}
						<Sun class="size-4" />
					{:else}
						<Moon class="size-4" />
					{/if}
				</Button>
			</div>
		</div>

		<div class="relative mt-6">
			<RouteCheckMenu
				{checker}
				turnstileSiteKey={data.turnstileSiteKey}
				stravaToken={data.stravaToken}
				stravaAthleteId={data.stravaAthleteId}
			/>
		</div>
	</section>

	<RouteCheckBanner {checker} />

	<Card
		class="relative h-[60dvh] overflow-hidden p-0 shadow-lg ring-1 ring-border/70 sm:h-auto sm:min-h-[400px] sm:flex-1"
	>
		<div
			class="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-3 rounded-full border bg-card/85 px-3 py-1.5 text-xs shadow-md backdrop-blur-md"
		>
			<span class="flex items-center gap-1.5">
				<span class="size-2 rounded-full bg-[#da272c]"></span>
				{m.legend_road_closed()}
			</span>
			{#if hasBusOnly}
				<span class="flex items-center gap-1.5">
					<span class="size-2 rounded-full bg-[#319151]"></span>
					{m.legend_road_bus_only()}
				</span>
			{/if}
			{#if checker.track}
				<span class="flex items-center gap-1.5">
					<span class="size-2 rounded-full bg-blue-500"></span>
					{m.legend_your_route()}
				</span>
			{/if}
		</div>
		<Map center={[2.9, 39.62]} zoom={initialZoom}>
			{#if checker.track}
				<MapRoute coordinates={checker.track.coordinates} color="#3b82f6" width={5} opacity={0.9} />
			{/if}
			{#each incidents as incident (incident.id)}
				{@const isAffected = checker.affectedIds.has(incident.id)}
				{@const busOnly = isBusOnlyClosure(incident)}
				{@const color = busOnly ? '#319151' : incident.isClosed ? '#da272c' : '#f3931a'}
				{#each incident.coordinates as line, i (i)}
					<MapRoute
						coordinates={line}
						{color}
						width={isAffected ? 6 : 4}
						opacity={checker.track && !isAffected ? 0.35 : 0.85}
					/>
				{/each}

				{#if incident.coordinates[0]?.[0]}
					{@const [lng, lat] = incident.coordinates[0][0]}
					<MapMarker longitude={lng} latitude={lat}>
						<MarkerContent>
							<div
								class="flex items-center gap-1 rounded-full border-2 border-background px-2 py-0.5 text-[10px] font-semibold text-white shadow-md"
								style="background-color: {color}"
							>
								<span>{EMOJI[incident.type]}</span>
								<span>{incident.roadName}</span>
							</div>
						</MarkerContent>
						<MarkerTooltip class="max-w-xs text-left whitespace-normal">
							<div class="flex flex-col gap-1">
								<div class="flex items-center gap-2">
									<span>{EMOJI[incident.type]}</span>
									<span class="font-semibold">{incident.roadName}</span>
									<span class="opacity-70">· {incident.type}</span>
									{#if busOnly}
										<span class="text-[#319151]">· {m.tooltip_bus_only()}</span>
									{:else if incident.isClosed}
										<span class="text-[#da272c]">· {m.tooltip_closed()}</span>
									{/if}
									{#if incident.onlyClosedOnWeekDays}
										<span class="text-[#f3931a]">· {m.tooltip_weekdays_only()}</span>
									{/if}
								</div>
								<div class="text-[10px] opacity-60">
									{fmtDate(incident.startDate)} → {fmtDate(incident.endDate)}
								</div>
								<div class="text-[10px] opacity-50">
									{m.tooltip_via({ provider: incident.providerName })}
								</div>
							</div>
						</MarkerTooltip>
					</MapMarker>
				{/if}
			{/each}
			<MapControls showFullscreen />
		</Map>
	</Card>

	<footer class="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
		<div class="flex flex-wrap items-center gap-1.5">
			<span>{m.footer_data_from()}</span>
			<a
				href="https://www.conselldemallorca.net/"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
			>
				Consell de Mallorca
				<ExternalLink class="size-3" />
			</a>
			{#if data.generatedAt}
				<span class="opacity-70"
					>· {m.footer_updated({ time: fmtUpdatedAt(data.generatedAt) })}</span
				>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<a
				href={resolve('/support')}
				class="inline-flex items-center gap-1.5 rounded-full border bg-card/85 px-3 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105 hover:text-foreground"
			>
				<Mail class="size-3.5" />
				{m.footer_contact()}
			</a>
			<a
				href="https://ko-fi.com/xiscosc"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1.5 rounded-full bg-[#ff5e5b] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-[#ff5e5b]/90"
			>
				<Icon icon="simple-icons:kofi" width="14" height="14" />
				{m.footer_kofi()}
			</a>
		</div>
	</footer>
</main>
