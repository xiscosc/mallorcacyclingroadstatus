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
	import { theme, toggleTheme } from '$lib/theme';
	import { createRouteChecker } from '$lib/route-check.svelte';
	import RouteCheckMenu from '$lib/components/route-check-menu.svelte';
	import RouteCheckBanner from '$lib/components/route-check-banner.svelte';
	import { DateTime } from 'luxon';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
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
</script>

<main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
	<section
		class="relative overflow-hidden rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<div
			class="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-linear-to-br from-indigo-500/25 to-violet-500/25 blur-3xl"
		></div>
		<div
			class="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-linear-to-tr from-violet-500/20 to-fuchsia-500/15 blur-3xl"
		></div>

		<div class="relative flex items-start justify-between gap-3">
			<div class="flex min-w-0 flex-col gap-3">
				<h1
					class="bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl"
				>
					🚲 Mallorca Cycling Road Status
				</h1>
				<p class="max-w-prose text-muted-foreground">
					{#if incidents.length === 0}
						No active road closures on Mallorca's cycling roads right now.
					{:else}
						<span class="font-medium text-foreground">{incidents.length}</span>
						active road closure{incidents.length === 1 ? '' : 's'} on Mallorca's cycling roads.
					{/if}
					Upload a GPX or paste a Komoot or Strava URL to see if your ride is affected.
				</p>
			</div>
			<Button
				variant="ghost"
				size="icon-lg"
				onclick={toggleTheme}
				aria-label="Toggle theme"
				class="shrink-0"
			>
				{#if $theme === 'dark'}
					<Sun class="size-4" />
				{:else}
					<Moon class="size-4" />
				{/if}
			</Button>
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

	<Card class="relative flex-1 overflow-hidden p-0 shadow-lg ring-1 ring-border/70">
		<div
			class="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-3 rounded-full border bg-card/85 px-3 py-1.5 text-xs shadow-md backdrop-blur-md"
		>
			<span class="flex items-center gap-1.5">
				<span class="size-2 rounded-full bg-red-500"></span>
				Road closed
			</span>
			{#if checker.track}
				<span class="flex items-center gap-1.5">
					<span class="size-2 rounded-full bg-blue-500"></span>
					Your route
				</span>
			{/if}
		</div>
		<Map center={[2.9, 39.62]} zoom={initialZoom}>
			{#if checker.track}
				<MapRoute coordinates={checker.track.coordinates} color="#3b82f6" width={5} opacity={0.9} />
			{/if}
			{#each incidents as incident (incident.id)}
				{@const isAffected = checker.affectedIds.has(incident.id)}
				{@const color = incident.isClosed ? '#ef4444' : '#f59e0b'}
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
									{#if incident.isClosed}
										<span class="text-red-500">· closed</span>
									{/if}
									{#if incident.onlyClosedOnWeekDays}
										<span class="text-amber-500">· weekdays only</span>
									{/if}
								</div>
								<div class="text-[10px] opacity-60">
									{fmtDate(incident.startDate)} → {fmtDate(incident.endDate)}
								</div>
								<div class="text-[10px] opacity-50">via {incident.providerName}</div>
							</div>
						</MarkerTooltip>
					</MapMarker>
				{/if}
			{/each}
			<MapControls />
		</Map>
	</Card>

	<footer class="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
		<div class="flex flex-wrap items-center gap-1.5">
			<span>Data from</span>
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
				<span class="opacity-70">· updated {fmtUpdatedAt(data.generatedAt)}</span>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<a
				href={resolve('/support')}
				class="inline-flex items-center gap-1.5 rounded-full border bg-card/85 px-3 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105 hover:text-foreground"
			>
				<Mail class="size-3.5" />
				Contact & Support
			</a>
			<a
				href="https://ko-fi.com/xiscosc"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1.5 rounded-full bg-[#ff5e5b] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-[#ff5e5b]/90"
			>
				<Icon icon="simple-icons:kofi" width="14" height="14" />
				Buy me a coffee
			</a>
		</div>
	</footer>
</main>
