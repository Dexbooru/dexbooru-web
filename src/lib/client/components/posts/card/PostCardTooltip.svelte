<script lang="ts">
	import LabelsDisplay from '$lib/client/components/labels/LabelsDisplay.svelte';
	import type { TPost } from '$lib/shared/types/posts';
	import Tooltip from 'flowbite-svelte/Tooltip.svelte';
	import { type Snippet } from 'svelte';

	type Props = {
		tags: TPost['tags'];
		artists: TPost['artists'];
		children: Snippet;
	};

	type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

	let { tags, artists, children }: Props = $props();

	const tooltipId = `tooltip-${crypto.randomUUID()}`;
	let placement: TooltipPlacement = $state('right');
</script>

<div id={tooltipId} class="h-full w-full" role="group">
	{@render children()}
</div>
<Tooltip
	{placement}
	offset={20}
	triggeredBy="#{tooltipId}"
	class="hidden w-max max-w-sm z-50 sm:block transition-all duration-300 ease-in-out"
>
	<div class="flex flex-col gap-2 p-2">
		{#if tags.length > 0}
			<div class="flex-col space-y-1">
				<span class="text-sm font-bold">Tags:</span>
				<LabelsDisplay labels={tags} labelType="tag" />
			</div>
		{/if}

		{#if artists.length > 0}
			<div class="flex-col space-y-1">
				<span class="text-sm font-bold">Artists:</span>
				<LabelsDisplay labels={artists} labelType="artist" />
			</div>
		{/if}
	</div>
</Tooltip>
