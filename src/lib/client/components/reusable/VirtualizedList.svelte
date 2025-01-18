<script lang="ts">
	// @ts-nocheck
	import VirtualList from 'svelte-tiny-virtual-list';

	type Props = {
		data: unknown[];
		listHeight: number;
		listItemFn?: ((item: unknown) => unknown) | null;
		listItemClass?: string;
		handleListItemClick?: ((event: Event) => void) | null;
	};

	let {
		data,
		listHeight,
		listItemFn = null,
		listItemClass = '',
		handleListItemClick = null,
	}: Props = $props();
</script>

<VirtualList itemCount={data.length} itemSize={30} height={listHeight}>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	{#snippet item({ index, style })}
		<li onclick={handleListItemClick} {style} class={listItemClass}>
			{listItemFn ? listItemFn(data[index]) : data[index]}
		</li>
	{/snippet}
</VirtualList>
