<script lang="ts">
	import { MAXIMUM_ARTIST_LENGTH, MAXIMUM_TAG_LENGTH } from '$lib/shared/constants/labels';
	import { Badge } from 'flowbite-svelte';
	import type { ComponentProps } from 'svelte';

	interface Props {
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
	}

	let {
		onPostsViewPage = false,
		labels = [],
		labelType,
		labelsAreLarge = false,
		labelColor = 'red',
		labelIsLink = true,
		labelIsDismissable = false,
		handleLabelClose = null,
	}: Props = $props();

	let processedLabels: string[] = $derived(
		labels.map((label) => (typeof label === 'object' ? label.name : label)),
	);

	const renderLabel = (label: string) => {
		if (onPostsViewPage) return label;
		return label.length >= 0.75 * maximumLabelLength ? label.slice(0, 20) + '...' : label;
	};

	const maximumLabelLength = labelType === 'tag' ? MAXIMUM_TAG_LENGTH : MAXIMUM_ARTIST_LENGTH;
</script>

<div class="flex flex-wrap">
	{#each processedLabels as label (label)}
		<Badge
			dismissable={labelIsDismissable}
			on:close={handleLabelClose}
			href={labelIsLink ? `/posts/${labelType}/${label}` : undefined}
			large={labelsAreLarge}
			class="ml-1 mr-1 mb-1"
			rounded
			color={labelColor}
			>{renderLabel(label)}
		</Badge>
	{/each}
</div>
