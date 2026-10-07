<script lang="ts">
	import type { IncidentNote } from '$lib/incidents';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	let { note, class: className }: { note: IncidentNote | undefined; class?: string } = $props();

	const summary = $derived(note?.summary?.[getLocale()]);
</script>

{#if note}
	<div class={['flex flex-col gap-0.5', className]}>
		{#if note.url}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- external URL from the feed -->
			<a
				href={note.url}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex w-fit items-center gap-1 font-semibold underline underline-offset-2"
			>
				{note.eventName ?? m.more_info()}
				<ExternalLink class="size-[1em] shrink-0" />
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{:else if note.eventName}
			<span class="font-semibold">{note.eventName}</span>
		{/if}
		{#if summary}
			<p class="opacity-80">{summary}</p>
		{:else if note.text}
			<!-- No summary (generation failed): show the source's own words, trimmed. -->
			<p lang="ca" class="line-clamp-3 whitespace-pre-line opacity-80">{note.text}</p>
		{/if}
	</div>
{/if}
