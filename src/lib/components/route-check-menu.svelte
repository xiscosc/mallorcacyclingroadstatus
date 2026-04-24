<script lang="ts">
	import type { RouteChecker } from '$lib/route-check.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Icon from '@iconify/svelte';
	import Upload from '@lucide/svelte/icons/upload';
	import Route from '@lucide/svelte/icons/route';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	let { checker, turnstileSiteKey }: { checker: RouteChecker; turnstileSiteKey: string } = $props();

	let fileInput: HTMLInputElement;
	let komootOpen = $state(false);
	let komootUrl = $state('');
	let turnstileToken = $state('');
	let turnstileContainer: HTMLDivElement | null = $state(null);
	let widgetId: string | undefined;

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
					Checking…
				{:else}
					<Route class="size-4" />
					Check route
					<ChevronDown class="size-4 opacity-80" />
				{/if}
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" collisionPadding={16} class="w-56">
		<DropdownMenu.Item onSelect={() => fileInput.click()}>
			<Upload />
			<span>Upload GPX file</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item onSelect={() => (komootOpen = true)}>
			<Icon icon="simple-icons:komoot" width="16" height="16" style="color: #006341" />
			<span>Komoot tour URL</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<Dialog.Root bind:open={komootOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon="simple-icons:komoot" width="20" height="20" style="color: #006341" />
				Check a Komoot tour
			</Dialog.Title>
			<Dialog.Description>
				Paste any Komoot tour URL — including the <code class="text-xs">share_token</code> for private
				tours.
			</Dialog.Description>
		</Dialog.Header>
		<form onsubmit={submitKomoot} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<Label for="komoot-url">Tour URL</Label>
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
						<Button {...props} variant="ghost">Cancel</Button>
					{/snippet}
				</Dialog.Close>
				<Button type="submit" disabled={!komootUrl.trim() || !turnstileToken}>Check tour</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
