<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import type { ComponentProps } from 'svelte';

	interface Props {
		labels?: string[] | { name: string }[];
		labelType: 'tag' | 'artist';
		labelsAreLarge?: boolean;
		labelColor?: ComponentProps<Badge>['color'];
		labelIsLink?: boolean;
		labelIsDismissable?: boolean;
		handleLabelClose?: ((event: CustomEvent<any>) => void) | null;
	}

	let {
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
			>{label}
		</Badge>
	{/each}
</div>
