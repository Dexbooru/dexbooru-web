<script lang="ts">
	import LabelsDisplay from '$lib/client/components/labels/LabelsDisplay.svelte';
	import type { TPost } from '$lib/shared/types/posts';
	import Tooltip from 'flowbite-svelte/Tooltip.svelte';
	import { type ComponentProps, type Snippet } from 'svelte';

	type Props = {
		tags: TPost['tags'];
		artists: TPost['artists'];
		children: Snippet;
	};

	type Placement = ComponentProps<Tooltip>['placement'];

	let { tags, artists, children }: Props = $props();

	const tooltipId = `tooltip-${crypto.randomUUID()}`;
	let placement: Placement = $state('right');
	let triggerElement: HTMLDivElement;

	function calculatePlacement() {
		if (!triggerElement) return;

		const rect = triggerElement.getBoundingClientRect();
		const { innerHeight, innerWidth } = window;

		const isNearBottom = rect.bottom > innerHeight - 250;

		if (isNearBottom) {
			placement = 'top';
		} else {
			const hasSpaceRight = innerWidth - rect.right > 384;
			if (hasSpaceRight) {
				placement = 'right';
			} else {
				placement = 'left';
			}
		}
	}
</script>

<div
	bind:this={triggerElement}
	id={tooltipId}
	class="h-full w-full"
	role="group"
	onmouseenter={calculatePlacement}
>
	{@render children()}
</div>
<Tooltip
	{placement}
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
