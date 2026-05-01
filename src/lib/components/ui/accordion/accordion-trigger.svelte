<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import type { Snippet } from 'svelte';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		children,
		...restProps
	}: WithoutChildrenOrChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps['level'];
		children: Snippet;
	} = $props();
</script>

<AccordionPrimitive.Header {level} class="flex" data-slot="accordion-header">
	<AccordionPrimitive.Trigger
		bind:ref
		data-slot="accordion-trigger"
		class={cn(
			'data-[state=open]>svg]:rotate-180 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
			className
		)}
		{...restProps}
	>
		{@render children()}
		<ChevronDownIcon
			class="size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200"
		/>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
