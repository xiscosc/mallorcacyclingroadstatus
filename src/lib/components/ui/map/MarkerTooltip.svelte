<script lang="ts">
	import { getContext } from 'svelte';
	import MapLibreGL, { type PopupOptions } from 'maplibre-gl';
	import { cn } from '$lib/utils.js';

	interface Props {
		children?: import('svelte').Snippet;
		class?: string;
		offset?: PopupOptions['offset'];
		anchor?: PopupOptions['anchor'];
	}

	let { children, class: className, offset = 16, anchor }: Props = $props();

	const markerCtx = getContext<{
		getMarker: () => MapLibreGL.Marker | null;
		getElement: () => HTMLDivElement | null;
		getMap: () => MapLibreGL.Map | null;
		isReady: () => boolean;
	}>('marker');

	let contentElement: HTMLDivElement | null = $state(null);

	// Create tooltip popup when marker is ready
	$effect(() => {
		const marker = markerCtx.getMarker();
		const markerElement = markerCtx.getElement();
		const map = markerCtx.getMap();
		const ready = markerCtx.isReady();

		if (!ready || !marker || !markerElement || !map || !contentElement) return;
		const content = contentElement;

		// Build popup options
		const popupOptions: PopupOptions = {
			offset,
			closeOnClick: true,
			closeButton: false,
			className: 'maplibre-popup-transparent'
		};

		if (anchor !== undefined) popupOptions.anchor = anchor;

		// MapLibre adopts the rendered content into the popup. It is never moved back into
		// the Svelte-owned wrapper: removing the popup on cleanup takes it with it, and a
		// re-run simply hands the same element to the new popup.
		const popupInstance = new MapLibreGL.Popup(popupOptions)
			.setMaxWidth('none')
			.setDOMContent(content);

		// Desktop: hover to preview. Mobile: tap marker to pin open / tap again to close.
		let pinned = false;
		let hideTimer: ReturnType<typeof setTimeout> | undefined;

		const cancelHide = () => clearTimeout(hideTimer);

		const show = () => {
			cancelHide();
			// `addTo` on an open popup removes it first, firing `close` — which would unpin it.
			if (popupInstance.isOpen()) return;
			popupInstance.setLngLat(marker.getLngLat()).addTo(map);
		};

		// Grace period so the pointer can cross the gap into the popup (to click a link).
		const scheduleHide = () => {
			if (pinned) return;
			cancelHide();
			hideTimer = setTimeout(() => popupInstance.remove(), 150);
		};

		const handleMouseEnter = () => {
			if (pinned) return;
			show();
		};

		const handleClick = (e: Event) => {
			e.stopPropagation();
			pinned = !pinned;
			if (pinned) show();
			else popupInstance.remove();
		};

		const handlePopupClose = () => {
			cancelHide();
			pinned = false;
		};

		markerElement.addEventListener('mouseenter', handleMouseEnter);
		markerElement.addEventListener('mouseleave', scheduleHide);
		markerElement.addEventListener('click', handleClick);
		content.addEventListener('mouseenter', cancelHide);
		content.addEventListener('mouseleave', scheduleHide);
		popupInstance.on('close', handlePopupClose);

		return () => {
			cancelHide();
			markerElement.removeEventListener('mouseenter', handleMouseEnter);
			markerElement.removeEventListener('mouseleave', scheduleHide);
			markerElement.removeEventListener('click', handleClick);
			content.removeEventListener('mouseenter', cancelHide);
			content.removeEventListener('mouseleave', scheduleHide);
			popupInstance.off('close', handlePopupClose);
			popupInstance.remove();
		};
	});
</script>

<!-- Hidden: the content only shows once MapLibre has adopted it into the popup. -->
<div style="display: none;">
	<div
		bind:this={contentElement}
		class={cn(
			'animate-in rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md fade-in-0 zoom-in-95',
			className
		)}
	>
		{@render children?.()}
	</div>
</div>

<style>
	:global(.maplibre-popup-transparent .maplibregl-popup-content) {
		background: transparent;
		box-shadow: none;
		padding: 0;
	}

	:global(.maplibre-popup-transparent .maplibregl-popup-tip) {
		display: none;
	}
</style>
