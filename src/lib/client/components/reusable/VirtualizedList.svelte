<script lang="ts">
	// @ts-nocheck
	import VirtualList from 'svelte-tiny-virtual-list';

	export let data: unknown[];
	export let listHeight: number;
	export let listItemFn: ((item: unknown) => unknown) | null = null;
	export let listItemClass: string = '';
	export let handleListItemClick: ((event: Event) => void) | null = null;
</script>

<VirtualList itemCount={data.length} itemSize={30} height={listHeight}>
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<li
		on:click={handleListItemClick}
		slot="item"
		let:index
		let:style
		{style}
		class={listItemClass}
	>
		{listItemFn ? listItemFn(data[index]) : data[index]}
	</li>
</VirtualList>
