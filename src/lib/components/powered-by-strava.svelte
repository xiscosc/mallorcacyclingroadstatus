<script lang="ts">
	// Official, unmodified "Powered by Strava" assets (developers.strava.com/guidelines).
	// Kept small and plain: Strava must never look more prominent than our own name.
	let { class: className }: { class?: string } = $props();
</script>

<span class={['inline-flex', className]}>
	<img
		src="/strava/powered-by-strava-black.svg"
		alt="Powered by Strava"
		width="365"
		height="37"
		class="h-3 w-auto dark:hidden"
	/>
	<img
		src="/strava/powered-by-strava-white.svg"
		alt="Powered by Strava"
		width="365"
		height="37"
		class="hidden h-3 w-auto dark:block"
	/>
</span>
