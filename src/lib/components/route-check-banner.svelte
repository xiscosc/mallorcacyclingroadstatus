<script lang="ts">
	import type { RouteChecker } from '$lib/route-check.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { m } from '$lib/paraglide/messages';
	import { DateTime } from 'luxon';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Bus from '@lucide/svelte/icons/bus';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Clock from '@lucide/svelte/icons/clock';
	import X from '@lucide/svelte/icons/x';
	import Plus from '@lucide/svelte/icons/plus';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import { Input } from '$lib/components/ui/input';
	import PoweredByStrava from '$lib/components/powered-by-strava.svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { Incident, IncidentNote as Note } from '$lib/incidents';

	let { checker, notes }: { checker: RouteChecker; notes: Record<string, Note> } = $props();

	const VISIBLE_EVENTS = 3;
	let expanded = $state(false);
	const today = DateTime.now().setZone('Europe/Madrid').toISODate();

	const affected = $derived((checker.affected ?? []).filter(checker.onRideDate));

	const toZoned = (d: Date) => DateTime.fromJSDate(d).setZone('Europe/Madrid');
	const fmt = (d: Date | undefined) => (d ? toZoned(d).toFormat('dd LLL HH:mm') : '—');
	const fmtRange = (a: Date | undefined, b: Date | undefined) => {
		if (!a && !b) return null;
		if (a && b && toZoned(a).hasSame(toZoned(b), 'day'))
			return `${fmt(a)}–${toZoned(b).toFormat('HH:mm')}`;
		return `${fmt(a)} → ${fmt(b)}`;
	};

	type Window = Pick<
		Incident,
		'startDate' | 'endDate' | 'isClosed' | 'hasTrafficCuts' | 'onlyClosedOnWeekDays'
	> & { status: string; roads: string[] };
	type EventGroup = { key: string; note?: Note; windows: Window[]; sameStatus: boolean };

	// One card per event (shared note), one row per time window listing its roads: an event
	// spanning several roads and days otherwise repeats the same card once per road stretch.
	const groups = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local scratch map, rebuilt on every run
		const byEvent = new Map<string, { note?: Note; windows: Map<string, Window> }>();
		for (const inc of affected) {
			const key = inc.noteId ?? inc.id;
			let group = byEvent.get(key);
			if (!group) {
				group = { note: inc.noteId ? notes[inc.noteId] : undefined, windows: new Map() };
				byEvent.set(key, group);
			}
			const status = `${inc.isClosed}|${inc.hasTrafficCuts}|${inc.onlyClosedOnWeekDays}`;
			const windowKey = `${inc.startDate?.getTime()}|${inc.endDate?.getTime()}|${status}`;
			const window = group.windows.get(windowKey);
			if (!window) group.windows.set(windowKey, { ...inc, status, roads: [inc.roadName] });
			else if (!window.roads.includes(inc.roadName)) window.roads.push(inc.roadName);
		}
		return [...byEvent].map(([key, { note, windows }]): EventGroup => {
			const sorted = [...windows.values()].sort(
				(a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0)
			);
			return {
				key,
				note,
				windows: sorted,
				sameStatus: new Set(sorted.map((w) => w.status)).size === 1
			};
		});
	});
	const visibleGroups = $derived(expanded ? groups : groups.slice(0, VISIBLE_EVENTS));

	const uniqueRoadNames = (incidents: { roadName: string }[]) =>
		[...new Set(incidents.map((i) => i.roadName))].join(', ');
</script>

{#snippet statusBadges(w: Window)}
	{#if w.isClosed}
		<Badge variant="destructive">{m.badge_closed()}</Badge>
	{:else if w.hasTrafficCuts}
		<Badge variant="secondary">{m.badge_traffic_cuts()}</Badge>
	{/if}
	{#if w.onlyClosedOnWeekDays}
		<Badge variant="secondary">{m.badge_weekdays_only()}</Badge>
	{/if}
{/snippet}

{#if checker.error}
	<Alert.Root variant="destructive" class="relative pr-10">
		<X class="size-4" />
		<Alert.Title>{m.banner_route_error_title()}</Alert.Title>
		<Alert.Description>{checker.error}</Alert.Description>
		<button
			type="button"
			onclick={checker.clear}
			aria-label={m.banner_dismiss()}
			class="absolute top-2 right-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
		>
			<X class="size-3.5" />
		</button>
	</Alert.Root>
{:else if checker.track && checker.affected}
	{@const ok = affected.length === 0}
	{@const busOnly = (checker.busOnly ?? []).filter(checker.onRideDate)}
	{@const anyHits = checker.affected.length + (checker.busOnly?.length ?? 0) > 0}
	<Alert.Root
		class={[
			'relative',
			ok && 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
			!ok && 'border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200'
		]}
	>
		{#if ok}
			<CircleCheck class="size-4" />
		{:else}
			<TriangleAlert class="size-4" />
		{/if}

		<Alert.Title class="pr-8 font-semibold">
			{#if ok}
				{m.banner_route_clear()}
			{:else if groups.length === 1}
				{m.banner_route_incidents_one({ count: groups.length })}
			{:else}
				{m.banner_route_incidents_other({ count: groups.length })}
			{/if}
		</Alert.Title>
		<Alert.Description class="pr-8 opacity-80">
			{checker.track.name ?? m.banner_route_unnamed()}
		</Alert.Description>

		{#if checker.stravaRouteId}
			<!-- Strava's guidelines require a link back to the source, with this exact (untranslated) text. -->
			<div class="col-start-2 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external link to Strava -->
				<a
					href="https://www.strava.com/routes/{checker.stravaRouteId}"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 text-xs font-bold text-[#FC5200] underline underline-offset-2"
				>
					View on Strava
					<ExternalLink class="size-3" />
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<PoweredByStrava />
			</div>
		{/if}

		{#if anyHits}
			<label class="col-span-full mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
				<CalendarDays class="size-4 shrink-0" />
				{m.banner_ride_date()}
				<Input type="date" bind:value={checker.rideDate} min={today} class="w-auto flex-1" />
			</label>
		{/if}

		{#if !ok}
			<ul
				class="col-span-full mt-3 flex flex-col divide-y rounded-md border bg-background/70 text-foreground"
			>
				{#each visibleGroups as group (group.key)}
					{@const summary = group.note?.summary?.[getLocale()]}
					<li class="flex flex-col gap-1.5 px-3 py-2.5">
						<div class="flex items-start justify-between gap-2">
							<div class="flex min-w-0 flex-col gap-0.5">
								{#if summary}
									<p class="font-semibold">{summary}</p>
								{/if}
								{#if group.note?.url}
									<!-- eslint-disable svelte/no-navigation-without-resolve -- external URL from the feed -->
									<a
										href={group.note.url}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground underline underline-offset-2"
									>
										<span class="line-clamp-2">{group.note.eventName ?? m.more_info()}</span>
										<ExternalLink class="size-3 shrink-0" />
									</a>
									<!-- eslint-enable svelte/no-navigation-without-resolve -->
								{:else if group.note?.eventName}
									<span class="text-xs text-muted-foreground">{group.note.eventName}</span>
								{/if}
								{#if !summary && group.note?.text}
									<!-- No summary (generation failed): show the source's own words, trimmed. -->
									<p lang="ca" class="line-clamp-3 text-xs whitespace-pre-line opacity-80">
										{group.note.text}
									</p>
								{/if}
							</div>
							{#if group.sameStatus}
								<div class="flex shrink-0 flex-wrap justify-end gap-1">
									{@render statusBadges(group.windows[0])}
								</div>
							{/if}
						</div>
						{#each group.windows as w (w.status + w.startDate?.getTime() + w.endDate?.getTime())}
							<div class="flex flex-col gap-0.5">
								<div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
									<Clock class="size-3" />
									<span>{fmtRange(w.startDate, w.endDate) ?? '—'}</span>
									{#if !group.sameStatus}
										{@render statusBadges(w)}
									{/if}
								</div>
								<p class="flex flex-wrap gap-x-1.5 text-sm font-medium">
									{#each w.roads as road, i (road)}
										<span class="whitespace-nowrap">
											{road}
											{#if i < w.roads.length - 1}<span class="text-muted-foreground">·</span>{/if}
										</span>
									{/each}
								</p>
							</div>
						{/each}
					</li>
				{/each}
				{#if groups.length > VISIBLE_EVENTS && !expanded}
					<li>
						<button
							type="button"
							onclick={() => (expanded = true)}
							class="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold hover:bg-muted/50"
						>
							<Plus class="size-3.5" />
							{m.banner_show_more({ count: groups.length - VISIBLE_EVENTS })}
						</button>
					</li>
				{/if}
			</ul>
		{/if}

		{#if busOnly.length > 0}
			<div
				class="col-span-full mt-3 flex items-start gap-2 rounded-md border bg-background/70 px-3 py-2 text-foreground"
			>
				<Bus class="mt-0.5 size-4 shrink-0" />
				<p class="text-sm">
					{#if busOnly.length === 1}
						{m.banner_bus_only_note_one({ roads: uniqueRoadNames(busOnly) })}
					{:else}
						{m.banner_bus_only_note_other({ roads: uniqueRoadNames(busOnly) })}
					{/if}
				</p>
			</div>
		{/if}

		<button
			type="button"
			onclick={checker.clear}
			aria-label={m.banner_clear_route()}
			class="absolute top-2 right-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
		>
			<X class="size-3.5" />
		</button>
	</Alert.Root>
{/if}
