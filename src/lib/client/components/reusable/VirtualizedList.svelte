<script lang="ts" generics="TItem = unknown">
	import SvelteVirtualList from '@humanspeak/svelte-virtual-list';
	import type { Snippet } from 'svelte';

	type Props = {
		data: TItem[];
		listHeight: number | string;
		defaultEstimatedItemHeight?: number;
		bufferSize?: number;
		/** Virtualize only once item count reaches this. Ignored when onLoadMore is set. */
		minItemsToVirtualize?: number;
		viewportLabel?: string;
		onLoadMore?: () => void | Promise<void>;
		hasMore?: boolean;
		loadMoreThreshold?: number;
		containerClass?: string;
		viewportClass?: string;
		contentClass?: string;
		itemsClass?: string;
		children: Snippet<[TItem]>;
	};

	let {
		data,
		listHeight,
		defaultEstimatedItemHeight = 40,
		bufferSize,
		minItemsToVirtualize = 8,
		viewportLabel = 'Scrollable list',
		onLoadMore,
		hasMore = false,
		loadMoreThreshold = 20,
		containerClass,
		viewportClass,
		contentClass,
		itemsClass,
		children,
	}: Props = $props();

	const estimatedContentHeight = $derived(Math.max(data.length, 1) * defaultEstimatedItemHeight);

	const shouldVirtualize = $derived(!!onLoadMore || data.length >= minItemsToVirtualize);

	const resolvedHeight = $derived(
		typeof listHeight === 'number'
			? `${Math.min(listHeight, estimatedContentHeight)}px`
			: `min(${estimatedContentHeight}px, ${listHeight})`,
	);
</script>

{#if shouldVirtualize}
	<div style="height: {resolvedHeight};" class={['w-full', containerClass]}>
		<SvelteVirtualList
			items={data}
			{defaultEstimatedItemHeight}
			{viewportLabel}
			{onLoadMore}
			hasMore={onLoadMore ? hasMore : false}
			{loadMoreThreshold}
			{...bufferSize !== undefined ? { bufferSize } : {}}
			{...viewportClass ? { viewportClass } : {}}
			{...contentClass ? { contentClass } : {}}
			{...itemsClass ? { itemsClass } : {}}
		>
			{#snippet renderItem(item)}
				{@render children(item)}
			{/snippet}
		</SvelteVirtualList>
	</div>
{:else}
	<div class={['w-full', containerClass]} role="region" aria-label={viewportLabel}>
		{#each data as item, index (index)}
			{@render children(item)}
		{/each}
	</div>
{/if}
