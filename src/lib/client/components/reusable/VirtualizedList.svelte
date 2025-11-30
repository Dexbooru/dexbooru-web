<script lang="ts">
	import SvelteVirtualList from '@humanspeak/svelte-virtual-list';
	import type { Snippet } from 'svelte';

	type Props = {
		data: any[];
		listHeight: number;
		children: Snippet<[any]>;
	};

	let { data, listHeight, children }: Props = $props();
</script>

<div style="height: {listHeight}px; overflow-y: auto;" class="virtual-list-container">
	<SvelteVirtualList items={data} defaultEstimatedItemHeight={40}>
		{#snippet renderItem(item)}
			{@render children(item)}
		{/snippet}
	</SvelteVirtualList>
</div>