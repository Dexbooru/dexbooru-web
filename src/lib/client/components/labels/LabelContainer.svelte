<script lang="ts">
	import {
		MAXIMUM_RENDERABLE_ARTISTS,
		MAXIMUM_RENDERABLE_TAGS,
	} from '$lib/client/constants/labels';
	import { renderLabel } from '$lib/shared/helpers/labels';
	import Badge from 'flowbite-svelte/Badge.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import type { ComponentProps } from 'svelte';

	type Props = {
		sliceLabels?: boolean;
		labels?: string[] | { name: string }[];
		labelType: 'tag' | 'artist';
		onPostsViewPage?: boolean;
		labelsAreLarge?: boolean;
		labelColor?: ComponentProps<Badge>['color'];
		labelIsLink?: boolean;
		labelIsDismissable?: boolean;
		handleLabelClose?:
			| ((event: CustomEvent<any> & { explicitOriginalTarget: Element }) => void)
			| null;
	};

	let {
		sliceLabels = false,
		onPostsViewPage = false,
		labels = [],
		labelType,
		labelsAreLarge = false,
		labelColor = 'red',
		labelIsLink = true,
		labelIsDismissable = false,
		handleLabelClose = null,
	}: Props = $props();

	let maximumLabelsLength = $derived(
		labelType === 'tag' ? MAXIMUM_RENDERABLE_TAGS : MAXIMUM_RENDERABLE_ARTISTS,
	);
	let unwrappedLabels = $derived(
		labels.map((label) => (typeof label === 'object' ? label.name : label)),
	);
	let slicedUnwrappedLabels = $derived(unwrappedLabels.slice(0, maximumLabelsLength));

	let showAllLabels = $state(false);
	let processedLabels: string[] = $derived.by(() => {
		if (!sliceLabels) return unwrappedLabels;
		return showAllLabels ? unwrappedLabels : slicedUnwrappedLabels;
	});
</script>

<div class="flex flex-wrap">
	{#each processedLabels as label (label)}
		<Badge
			dismissable={labelIsDismissable}
			on:close={handleLabelClose as (_event: CustomEvent<any>) => void}
			href={labelIsLink ? `/posts/${labelType}/${label}` : undefined}
			large={labelsAreLarge}
			class="ml-1 mr-1 mb-1"
			rounded
			color={labelColor}
			>{renderLabel(label, labelType, onPostsViewPage)}
		</Badge>
	{/each}
</div>
{#if sliceLabels && labels.length > maximumLabelsLength}
	<Button size="sm" class="ml-1 mr-1 mb-1" on:click={() => (showAllLabels = !showAllLabels)}
		>{showAllLabels ? 'Show less' : 'Show all'}
	</Button>
{/if}
