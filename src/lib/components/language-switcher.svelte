<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { getLocale, locales, setLocale, type Locale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import Languages from '@lucide/svelte/icons/languages';
	import Check from '@lucide/svelte/icons/check';

	const NAMES: Record<Locale, string> = {
		en: 'English',
		de: 'Deutsch',
		es: 'Español',
		ca: 'Català'
	};

	const current = $derived(getLocale());
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon-lg"
				aria-label={m.change_language()}
				class="shrink-0"
			>
				<Languages class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-40">
		{#each locales as locale (locale)}
			<DropdownMenu.Item onSelect={() => setLocale(locale)}>
				<span class="flex-1">{NAMES[locale]}</span>
				{#if locale === current}
					<Check class="size-4 opacity-70" />
				{/if}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
