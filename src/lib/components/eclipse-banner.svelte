<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import Bike from '@lucide/svelte/icons/bike';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	const SOURCE_URL =
		'https://www.caib.es/webgoib/es/-/mesures-de-control-restricci%C3%B3-i-tancament-3';
</script>

<a
	href={SOURCE_URL}
	target="_blank"
	rel="noopener noreferrer"
	class="group relative isolate block overflow-hidden rounded-xl bg-[#171524] px-5 py-4 text-white shadow-md ring-1 ring-white/10 transition-[box-shadow] hover:ring-[#f6c85f]/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f6c85f] sm:px-6"
	aria-labelledby="eclipse-banner-title"
>
	<div
		class="pointer-events-none absolute -top-20 -right-10 size-44 rounded-full bg-[#f3931a]/15 blur-3xl"
		aria-hidden="true"
	></div>

	<div class="relative z-10 flex items-center gap-6">
		<div class="min-w-0 flex-1">
			<p class="text-[11px] font-bold tracking-[0.16em] text-[#f6c85f] uppercase">
				{m.eclipse_banner_eyebrow()}
			</p>
			<h2 id="eclipse-banner-title" class="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
				{m.eclipse_banner_title()}
			</h2>
			<p class="mt-1 max-w-3xl text-sm leading-relaxed text-white/70">
				{m.eclipse_banner_description()}
			</p>

			<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
				<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#73d18f]">
					<span
						class="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#319151]/20"
					>
						<Bike class="size-3.5" aria-hidden="true" />
					</span>
					{m.eclipse_banner_bikes()}
				</span>
				<span class="text-[11px] text-white/50">{m.eclipse_banner_caveat()}</span>
				<span
					class="inline-flex items-center gap-1 text-xs font-semibold text-[#f6c85f] underline decoration-[#f6c85f]/40 underline-offset-4 transition-colors group-hover:text-white sm:ml-auto"
				>
					{m.eclipse_banner_link()}
					<ExternalLink class="size-3" aria-hidden="true" />
				</span>
			</div>
		</div>

		<div
			class="pointer-events-none relative hidden size-20 shrink-0 rounded-full bg-[#f6c85f] shadow-[0_0_30px_4px_rgba(243,147,26,0.28)] sm:block"
			aria-hidden="true"
		>
			<div class="absolute -top-0.5 -left-2 size-full rounded-full bg-[#171524]"></div>
		</div>
	</div>
</a>
