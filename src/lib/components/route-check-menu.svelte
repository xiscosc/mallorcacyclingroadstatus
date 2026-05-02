<script lang="ts">
	import { resolve } from '$app/paths';
	import type { RouteChecker } from '$lib/route-check.svelte';
	import { fetchStravaRoutes, type StravaRouteSummary } from '$lib/strava';
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import Icon from '@iconify/svelte';
	import Upload from '@lucide/svelte/icons/upload';
	import Route from '@lucide/svelte/icons/route';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Star from '@lucide/svelte/icons/star';
	import Lock from '@lucide/svelte/icons/lock';

	let {
		checker,
		turnstileSiteKey,
		stravaToken,
		stravaAthleteId
	}: {
		checker: RouteChecker;
		turnstileSiteKey: string;
		stravaToken: string | null;
		stravaAthleteId: string | null;
	} = $props();

	let fileInput: HTMLInputElement;
	let komootOpen = $state(false);
	let komootUrl = $state('');
	let stravaOpen = $state(false);
	let stravaUrl = $state('');
	let stravaRoutes = $state<StravaRouteSummary[]>([]);
	let stravaRoutesLoaded = $state(false);
	let stravaRoutesLoading = $state(false);
	let stravaRoutesError = $state<string | null>(null);
	let turnstileToken = $state('');
	let turnstileContainer: HTMLDivElement | null = $state(null);
	let widgetId: string | undefined;

	$effect(() => {
		if (
			stravaOpen &&
			stravaToken &&
			stravaAthleteId &&
			!stravaRoutesLoaded &&
			!stravaRoutesLoading
		) {
			loadStravaRoutes();
		}
	});

	async function loadStravaRoutes() {
		if (!stravaToken || !stravaAthleteId) return;
		stravaRoutesLoading = true;
		stravaRoutesError = null;
		try {
			stravaRoutes = await fetchStravaRoutes(stravaAthleteId, stravaToken);
			stravaRoutesLoaded = true;
		} catch (err) {
			stravaRoutesError = err instanceof Error ? err.message : m.error_failed_load_strava();
		} finally {
			stravaRoutesLoading = false;
		}
	}

	async function selectStravaRoute(routeId: string) {
		if (!stravaToken) return;
		const token = stravaToken;
		stravaOpen = false;
		await checker.loadStravaRouteId(routeId, token);
	}

	function fmtKm(meters: number): string {
		return `${(meters / 1000).toFixed(1)} km`;
	}

	function fmtMeters(meters: number): string {
		return `${Math.round(meters)} m`;
	}

	function waitForTurnstile(): Promise<TurnstileWidget> {
		return new Promise((resolve) => {
			if (window.turnstile) return resolve(window.turnstile);
			const iv = setInterval(() => {
				if (window.turnstile) {
					clearInterval(iv);
					resolve(window.turnstile);
				}
			}, 50);
		});
	}

	$effect(() => {
		if (!komootOpen || !turnstileContainer || !turnstileSiteKey) return;
		const container = turnstileContainer;
		let cancelled = false;
		waitForTurnstile().then((ts) => {
			if (cancelled) return;
			widgetId = ts.render(container, {
				sitekey: turnstileSiteKey,
				callback: (token) => (turnstileToken = token),
				'expired-callback': () => (turnstileToken = ''),
				'error-callback': () => (turnstileToken = '')
			});
		});
		return () => {
			cancelled = true;
			if (widgetId && window.turnstile) {
				window.turnstile.remove(widgetId);
				widgetId = undefined;
			}
			turnstileToken = '';
		};
	});

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) checker.loadGpx(file);
		input.value = '';
	}

	async function submitKomoot(e: SubmitEvent) {
		e.preventDefault();
		const trimmed = komootUrl.trim();
		if (!trimmed || !turnstileToken) return;
		const token = turnstileToken;
		komootOpen = false;
		komootUrl = '';
		await checker.loadKomoot(trimmed, token);
	}

	async function submitStrava(e: SubmitEvent) {
		e.preventDefault();
		const url = stravaUrl.trim();
		if (!url || !stravaToken) return;
		const token = stravaToken;
		stravaOpen = false;
		stravaUrl = '';
		await checker.loadStrava(url, token);
	}
</script>

<svelte:head>
	{#if turnstileSiteKey}
		<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
	{/if}
</svelte:head>

<input
	bind:this={fileInput}
	type="file"
	accept=".gpx,application/gpx+xml,application/xml,text/xml"
	onchange={onFileChange}
	class="hidden"
/>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				size="lg"
				disabled={checker.isProcessing}
				class="bg-linear-to-r from-indigo-500 to-violet-500 font-semibold text-white shadow-md shadow-indigo-500/30 hover:from-indigo-500/90 hover:to-violet-500/90"
			>
				{#if checker.isProcessing}
					<div class="animate-spin">
						<Loader2 class="size-4" />
					</div>
					{m.check_button_processing()}
				{:else}
					<Route class="size-4" />
					{m.check_button_label()}
					<ChevronDown class="size-4 opacity-80" />
				{/if}
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" collisionPadding={16} class="w-56">
		<DropdownMenu.Item onSelect={() => fileInput.click()}>
			<Upload />
			<span>{m.check_menu_upload_gpx()}</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item onSelect={() => (komootOpen = true)}>
			<Icon icon="simple-icons:komoot" width="16" height="16" style="color: #006341" />
			<span>{m.check_menu_komoot()}</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item disabled>
			<Icon icon="simple-icons:strava" width="16" height="16" style="color: #fc4c02" />
			<span>{m.check_menu_strava()}</span>
			<span class="ml-auto text-xs text-muted-foreground">{m.check_menu_soon()}</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<Dialog.Root bind:open={komootOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon="simple-icons:komoot" width="20" height="20" style="color: #006341" />
				{m.komoot_dialog_title()}
			</Dialog.Title>
			<Dialog.Description>
				{m.komoot_dialog_description()}
			</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={submitKomoot} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<Label for="komoot-url">{m.komoot_dialog_url_label()}</Label>
				<Input
					id="komoot-url"
					type="url"
					bind:value={komootUrl}
					placeholder="https://www.komoot.com/tour/…"
					required
					autocomplete="off"
				/>
			</div>
			<div bind:this={turnstileContainer}></div>
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button {...props} variant="ghost">{m.dialog_cancel()}</Button>
					{/snippet}
				</Dialog.Close>
				<Button type="submit" disabled={!komootUrl.trim() || !turnstileToken}>
					{m.komoot_dialog_submit()}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={stravaOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon="simple-icons:strava" width="20" height="20" style="color: #fc4c02" />
				{m.strava_dialog_title()}
			</Dialog.Title>
			<Dialog.Description>
				{#if stravaToken}
					{m.strava_dialog_description_connected()}
				{:else}
					{m.strava_dialog_description_disconnected()}
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		{#if stravaToken}
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<Label>{m.strava_dialog_routes_label()}</Label>
						<Button
							variant="ghost"
							size="sm"
							onclick={loadStravaRoutes}
							disabled={stravaRoutesLoading}
							aria-label={m.strava_dialog_refresh_routes()}
							class="h-7 px-2"
						>
							<RefreshCw class="size-3.5 {stravaRoutesLoading ? 'animate-spin' : ''}" />
						</Button>
					</div>
					{#if stravaRoutesError}
						<p class="text-xs text-destructive">{stravaRoutesError}</p>
					{:else if stravaRoutesLoading && !stravaRoutesLoaded}
						<div class="flex flex-col gap-2">
							{#each [0, 1, 2, 3] as i (i)}
								<Skeleton class="h-12 w-full" />
							{/each}
						</div>
					{:else if stravaRoutesLoaded && stravaRoutes.length === 0}
						<p class="text-xs text-muted-foreground">{m.strava_dialog_no_routes()}</p>
					{:else if stravaRoutes.length > 0}
						<ScrollArea class="h-64 rounded-md border">
							<ul class="flex flex-col">
								{#each stravaRoutes as route, i (route.id)}
									{#if i > 0}
										<Separator />
									{/if}
									<li>
										<button
											type="button"
											onclick={() => selectStravaRoute(route.id)}
											class="flex w-full flex-col gap-1 px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
										>
											<div class="flex items-center gap-2">
												<span class="truncate text-sm font-medium">{route.name}</span>
												{#if route.starred}
													<Star class="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
												{/if}
												{#if route.private}
													<Lock class="size-3 shrink-0 text-muted-foreground" />
												{/if}
											</div>
											<div
												class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
											>
												<span>{fmtKm(route.distance)}</span>
												{#if route.elevationGain > 0}
													<span>· ↑ {fmtMeters(route.elevationGain)}</span>
												{/if}
											</div>
										</button>
									</li>
								{/each}
							</ul>
						</ScrollArea>
					{/if}
				</div>

				<div class="flex items-center gap-3">
					<Separator class="flex-1" />
					<span class="text-xs text-muted-foreground">{m.strava_dialog_or_paste_url()}</span>
					<Separator class="flex-1" />
				</div>

				<form onsubmit={submitStrava} class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label for="strava-url">{m.strava_dialog_url_label()}</Label>
						<Input
							id="strava-url"
							type="url"
							bind:value={stravaUrl}
							placeholder="https://www.strava.com/routes/…"
							autocomplete="off"
						/>
					</div>
					<Dialog.Footer>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button {...props} variant="ghost">{m.dialog_cancel()}</Button>
							{/snippet}
						</Dialog.Close>
						<Button type="submit" disabled={!stravaUrl.trim()}>{m.strava_dialog_submit()}</Button>
					</Dialog.Footer>
				</form>
			</div>
		{:else}
			<div class="flex flex-col gap-4">
				<a
					href={resolve('/auth/strava')}
					class="inline-flex items-center justify-center gap-2 rounded-md bg-[#fc4c02] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#fc4c02]/90"
				>
					<Icon icon="simple-icons:strava" width="16" height="16" />
					{m.strava_dialog_connect()}
				</a>
				<Dialog.Footer>
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props} variant="ghost">{m.dialog_cancel()}</Button>
						{/snippet}
					</Dialog.Close>
				</Dialog.Footer>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
