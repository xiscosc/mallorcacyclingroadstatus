<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import Bike from '@lucide/svelte/icons/bike';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	const RENTAL_URL = 'https://www.catalinamallorca.com/?utm_source=mallorcacyclingroads.cc';
</script>

<a
	href={RENTAL_URL}
	target="_blank"
	rel="noopener noreferrer"
	class="group relative block overflow-hidden rounded-2xl bg-card/85 p-4 shadow-sm ring-1 ring-border/70 backdrop-blur-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:p-5"
	aria-labelledby="bike-rental-banner-title"
>
	<div class="pointer-events-none absolute inset-x-0 top-0 flex h-1" aria-hidden="true">
		<span class="flex-1 bg-[#319151]"></span>
		<span class="flex-1 bg-[#f3931a]"></span>
		<span class="flex-1 bg-[#da272c]"></span>
	</div>

	<div class="flex items-center gap-4 sm:gap-5">
		<span
			class="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#319151]/12 text-[#319151] ring-1 ring-[#319151]/20 sm:size-12"
			aria-hidden="true"
		>
			<Bike class="size-6" />
		</span>

		<div class="min-w-0 flex-1">
			<p class="text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
				{m.rental_banner_eyebrow()}
			</p>
			<h2 id="bike-rental-banner-title" class="mt-0.5 text-lg font-bold tracking-tight sm:text-xl">
				{m.rental_banner_title()}
			</h2>
		</div>

		<span
			class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#f3931a] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-[#da7d08] sm:px-4 sm:text-sm"
		>
			<span class="hidden sm:inline">{m.rental_banner_link()}</span>
			<ExternalLink class="size-3.5" aria-hidden="true" />
		</span>
	</div>
</a>
