<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { CYCLING_ROAD_REGIONS, CYCLING_ROADS } from '$lib/cycling-roads';
	import { theme, toggleTheme } from '$lib/theme';
	import { m } from '$lib/paraglide/messages';
	import LanguageSwitcher from '$lib/components/language-switcher.svelte';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Link from '@lucide/svelte/icons/link';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const contactUrl = 'https://linktr.ee/xiscosc';
	const contactLabel = 'linktr.ee/xiscosc';
	const totalRoads = CYCLING_ROADS.length;

	const REGION_NAME: Record<string, () => string> = {
		'tramuntana-core': m.region_tramuntana_core,
		'tramuntana-south-west': m.region_tramuntana_south_west,
		'tramuntana-raiguer': m.region_tramuntana_raiguer,
		'formentor-north': m.region_formentor_north,
		'north-coast-feeders': m.region_north_coast,
		'pla-central': m.region_pla,
		llevant: m.region_llevant,
		'migjorn-southeast': m.region_migjorn,
		'south-migjorn': m.region_south
	};
	const REGION_DESCRIPTION: Record<string, () => string> = {
		'tramuntana-core': m.region_tramuntana_core_description,
		'tramuntana-south-west': m.region_tramuntana_south_west_description,
		'tramuntana-raiguer': m.region_tramuntana_raiguer_description,
		'formentor-north': m.region_formentor_north_description,
		'north-coast-feeders': m.region_north_coast_description,
		'pla-central': m.region_pla_description,
		llevant: m.region_llevant_description,
		'migjorn-southeast': m.region_migjorn_description,
		'south-migjorn': m.region_south_description
	};
</script>

<svelte:head>
	<title>{m.support_meta_title()}</title>
	<meta name="description" content={m.support_meta_description()} />
	<meta property="og:title" content={m.support_meta_title()} />
	<meta property="og:description" content={m.support_meta_description()} />
	<meta name="twitter:title" content={m.support_meta_title()} />
	<meta name="twitter:description" content={m.support_meta_description()} />
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
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
					{m.support_heading()}
				</h1>
				<p class="max-w-prose text-muted-foreground">
					{m.support_intro()}
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
	</section>

	<section
		class="flex flex-col gap-3 rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<h2 class="text-xl font-semibold tracking-tight">{m.support_contact_heading()}</h2>
		<p class="text-sm text-muted-foreground">
			{m.support_contact_text()}
		</p>
		<div>
			<a
				href={contactUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-sm transition-transform hover:scale-105 hover:text-foreground"
			>
				<Link class="size-4" />
				{contactLabel}
			</a>
		</div>
	</section>

	<section
		class="flex flex-col gap-3 rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<h2 class="text-xl font-semibold tracking-tight">{m.support_about_heading()}</h2>
		<div class="flex flex-col gap-3 text-sm text-muted-foreground">
			<p>
				<span class="font-medium text-foreground">{m.support_about_paragraph_1_strong()}</span>
				{m.support_about_paragraph_1_rest()}
			</p>
			<p>{m.support_about_paragraph_2()}</p>
		</div>
	</section>

	<section
		class="flex flex-col gap-3 rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 class="text-xl font-semibold tracking-tight">{m.support_roads_heading()}</h2>
			<span class="text-xs text-muted-foreground">
				{m.support_roads_summary({
					roads: totalRoads,
					regions: CYCLING_ROAD_REGIONS.length
				})}
			</span>
		</div>
		<p class="text-sm text-muted-foreground">
			{m.support_roads_intro()}
		</p>
		<Accordion.Root type="single" class="w-full">
			{#each CYCLING_ROAD_REGIONS as region (region.id)}
				<Accordion.Item value={region.id}>
					<Accordion.Trigger>
						<span class="flex flex-1 items-center gap-3">
							<span class="font-medium text-foreground"
								>{REGION_NAME[region.id]?.() ?? region.name}</span
							>
							<span class="text-xs font-normal text-muted-foreground">
								{m.support_roads_count({ count: region.roads.length })}
							</span>
						</span>
					</Accordion.Trigger>
					<Accordion.Content>
						<p class="mb-3 text-xs text-muted-foreground">
							{REGION_DESCRIPTION[region.id]?.() ?? region.description}
						</p>
						<div class="flex flex-wrap gap-1.5">
							{#each region.roads as road (road)}
								<Badge variant="secondary" class="font-mono">{road}</Badge>
							{/each}
						</div>
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
		<p class="text-sm text-muted-foreground">
			{m.support_roads_missing_intro()}
			<a
				href={contactUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="underline underline-offset-2 hover:text-foreground">{contactLabel}</a
			>
			{m.support_roads_missing_outro()}
		</p>
	</section>

	<section
		class="flex flex-col gap-3 rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<h2 class="text-xl font-semibold tracking-tight">{m.support_privacy_heading()}</h2>
		<div class="flex flex-col gap-3 text-sm text-muted-foreground">
			<p>
				<span class="font-medium text-foreground">{m.support_privacy_lead_strong()}</span>
				{m.support_privacy_lead_rest()}
			</p>
			<ul class="flex list-disc flex-col gap-2 pl-5">
				<li>
					<span class="font-medium text-foreground">{m.support_privacy_gpx_strong()}</span>
					{m.support_privacy_gpx_rest()}
				</li>
				<li>
					<span class="font-medium text-foreground">{m.support_privacy_komoot_strong()}</span>
					{m.support_privacy_komoot_rest()}
				</li>
				<li>
					<span class="font-medium text-foreground">{m.support_privacy_strava_strong()}</span>
					{m.support_privacy_strava_rest()}
					<a
						href="https://www.strava.com/settings/apps"
						target="_blank"
						rel="noopener noreferrer"
						class="underline underline-offset-2 hover:text-foreground"
						>{m.support_privacy_strava_link()}</a
					>.
				</li>
			</ul>
			<p>
				{m.support_privacy_outro_intro()}
				<a
					href={contactUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2 hover:text-foreground">{contactLabel}</a
				>.
			</p>
		</div>
	</section>

	<footer class="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
		<a
			href={resolve('/')}
			class="inline-flex items-center gap-1.5 rounded-full border bg-card/85 px-3 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105 hover:text-foreground"
		>
			<ArrowLeft class="size-3.5" />
			{m.support_back_to_map()}
		</a>
	</footer>
</main>
