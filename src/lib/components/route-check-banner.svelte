<script lang="ts">
	import type { RouteChecker } from '$lib/route-check.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { m } from '$lib/paraglide/messages';
	import { ECLIPSE_INFO_URL } from '$lib/eclipse';
	import { DateTime } from 'luxon';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Bus from '@lucide/svelte/icons/bus';
	import Eclipse from '@lucide/svelte/icons/eclipse';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Clock from '@lucide/svelte/icons/clock';
	import X from '@lucide/svelte/icons/x';

	let { checker }: { checker: RouteChecker } = $props();

	const fmt = (d: Date | undefined) =>
		d ? DateTime.fromJSDate(d).setZone('Europe/Madrid').toFormat('dd LLL HH:mm') : '—';
	const fmtRange = (a: Date | undefined, b: Date | undefined) =>
		!a && !b ? null : `${fmt(a)} → ${fmt(b)}`;

	const uniqueRoadNames = (incidents: { roadName: string }[]) =>
		[...new Set(incidents.map((i) => i.roadName))].join(', ');
</script>

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
	{@const ok = checker.affected.length === 0}
	{@const busOnly = checker.busOnly ?? []}
	{@const eclipse = checker.eclipse ?? []}
	<Alert.Root
		class={[
			'relative pr-10',
			ok && 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
			!ok && 'border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200'
		]}
	>
		{#if ok}
			<CircleCheck class="size-4" />
		{:else}
			<TriangleAlert class="size-4" />
		{/if}

		<Alert.Title class="font-semibold">
			{#if ok}
				{m.banner_route_clear()}
			{:else if checker.affected.length === 1}
				{m.banner_route_incidents_one({ count: checker.affected.length })}
			{:else}
				{m.banner_route_incidents_other({ count: checker.affected.length })}
			{/if}
		</Alert.Title>
		<Alert.Description class="opacity-80">
			{checker.track.name ?? m.banner_route_unnamed()}
		</Alert.Description>

		{#if !ok}
			<ul class="col-start-2 mt-3 flex flex-col gap-2">
				{#each checker.affected as inc (inc.id)}
					<li
						class="flex flex-col gap-1.5 rounded-md border bg-background/70 px-3 py-2 text-foreground"
					>
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-semibold">{inc.roadName}</span>
							<Badge variant="outline">{inc.type}</Badge>
							{#if inc.isClosed}
								<Badge variant="destructive">{m.badge_closed()}</Badge>
							{:else if inc.hasTrafficCuts}
								<Badge variant="secondary">{m.badge_traffic_cuts()}</Badge>
							{/if}
							{#if inc.onlyClosedOnWeekDays}
								<Badge variant="secondary">{m.badge_weekdays_only()}</Badge>
							{/if}
						</div>
						{#if fmtRange(inc.startDate, inc.endDate)}
							<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Clock class="size-3" />
								<span>{fmtRange(inc.startDate, inc.endDate)}</span>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		{#if busOnly.length > 0}
			<div
				class="col-start-2 mt-3 flex items-start gap-2 rounded-md border bg-background/70 px-3 py-2 text-foreground"
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

		{#if eclipse.length > 0}
			<div
				class="col-start-2 mt-3 flex items-start gap-2 rounded-md border bg-background/70 px-3 py-2 text-foreground"
			>
				<Eclipse class="mt-0.5 size-4 shrink-0 text-[#8059a6]" />
				<p class="text-sm">
					{#if eclipse.length === 1}
						{m.banner_eclipse_note_one({ roads: uniqueRoadNames(eclipse) })}
					{:else}
						{m.banner_eclipse_note_other({ roads: uniqueRoadNames(eclipse) })}
					{/if}
					<a
						href={ECLIPSE_INFO_URL}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1 font-semibold text-[#8059a6] underline underline-offset-2"
					>
						{m.eclipse_banner_link()}
						<ExternalLink class="size-3" />
					</a>
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
