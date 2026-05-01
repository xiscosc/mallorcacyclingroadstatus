<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { cn, type WithoutChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<AccordionPrimitive.RootProps> = $props();
</script>

<AccordionPrimitive.Root bind:ref data-slot="accordion" class={cn(className)} {...restProps} />
