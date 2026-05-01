<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { CYCLING_ROAD_REGIONS, CYCLING_ROADS } from '$lib/cycling-roads';
	import { theme, toggleTheme } from '$lib/theme';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Mail from '@lucide/svelte/icons/mail';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const supportEmail = 'xiscosastre@gmail.com';
	const totalRoads = CYCLING_ROADS.length;
</script>

<svelte:head>
	<title>Support · Mallorca Cycling Road Status</title>
	<meta
		name="description"
		content="Support and contact information for Mallorca Cycling Road Status."
	/>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
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
					Support
				</h1>
				<p class="max-w-prose text-muted-foreground">
					Questions, bug reports or feedback about Mallorca Cycling Road Status? Get in touch — I'm
					happy to help.
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
	</section>

	<section
		class="flex flex-col gap-3 rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<h2 class="text-xl font-semibold tracking-tight">Contact</h2>
		<p class="text-sm text-muted-foreground">
			The fastest way to reach me is by email. I usually reply within a few days.
		</p>
		<div>
			<a
				href="mailto:{supportEmail}"
				class="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-sm transition-transform hover:scale-105 hover:text-foreground"
			>
				<Mail class="size-4" />
				{supportEmail}
			</a>
		</div>
	</section>

	<section
		class="flex flex-col gap-3 rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<h2 class="text-xl font-semibold tracking-tight">About the project</h2>
		<div class="flex flex-col gap-3 text-sm text-muted-foreground">
			<p>
				<span class="font-medium text-foreground">Mallorca Cycling Road Status</span> is a free, non-commercial
				side project that surfaces live road closures on Mallorca's road-cycling network. It pulls public
				data from the Consell de Mallorca every few hours and overlays it on a map so cyclists can see
				what's affected before heading out.
			</p>
			<p>
				You can upload a GPX file or paste a Komoot or Strava route URL to check whether your ride
				crosses an active closure. The whole site is open to anyone — no account required.
			</p>
		</div>
	</section>

	<section
		class="flex flex-col gap-3 rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 class="text-xl font-semibold tracking-tight">Roads we monitor</h2>
			<span class="text-xs text-muted-foreground">
				{totalRoads} roads across {CYCLING_ROAD_REGIONS.length} regions
			</span>
		</div>
		<p class="text-sm text-muted-foreground">
			These are the Mallorca roads (Ma-… codes from the Consell de Mallorca's network) we currently
			watch for closures. Motorways and tunnels where bikes are not allowed are excluded.
		</p>
		<Accordion.Root type="single" class="w-full">
			{#each CYCLING_ROAD_REGIONS as region (region.id)}
				<Accordion.Item value={region.id}>
					<Accordion.Trigger>
						<span class="flex flex-1 items-center gap-3">
							<span class="font-medium text-foreground">{region.name}</span>
							<span class="text-xs font-normal text-muted-foreground"
								>{region.roads.length} roads</span
							>
						</span>
					</Accordion.Trigger>
					<Accordion.Content>
						<p class="mb-3 text-xs text-muted-foreground">{region.description}</p>
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
			Missing a road you ride? Email
			<a href="mailto:{supportEmail}" class="underline underline-offset-2 hover:text-foreground"
				>{supportEmail}</a
			>
			and I'll add it to the list.
		</p>
	</section>

	<section
		class="flex flex-col gap-3 rounded-2xl bg-card/80 p-6 shadow-sm ring-1 ring-border/70 backdrop-blur-sm sm:p-8"
	>
		<h2 class="text-xl font-semibold tracking-tight">Privacy & personal data</h2>
		<div class="flex flex-col gap-3 text-sm text-muted-foreground">
			<p>
				<span class="font-medium text-foreground"
					>This site does not collect or store any personal data.</span
				>
				There are no user accounts, no tracking pixels and no analytics.
			</p>
			<ul class="flex list-disc flex-col gap-2 pl-5">
				<li>
					<span class="font-medium text-foreground">GPX files</span> are parsed entirely in your browser.
					They are never uploaded to our server.
				</li>
				<li>
					<span class="font-medium text-foreground">Komoot URLs</span> are fetched server-side only because
					Komoot's API blocks browser requests. The URL is used once to retrieve the route and is not
					stored.
				</li>
				<li>
					<span class="font-medium text-foreground">Strava integration</span> uses OAuth so you can
					pick a route from your own account. The access token is kept in a secure cookie in your
					browser and is used only to read the route you choose. We never persist your token,
					profile or activities, and you can disconnect the app at any time from your
					<a
						href="https://www.strava.com/settings/apps"
						target="_blank"
						rel="noopener noreferrer"
						class="underline underline-offset-2 hover:text-foreground">Strava settings</a
					>.
				</li>
			</ul>
			<p>
				If you have any privacy questions or want to request more information, just send an email to
				<a href="mailto:{supportEmail}" class="underline underline-offset-2 hover:text-foreground"
					>{supportEmail}</a
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
			Back to map
		</a>
	</footer>
</main>
