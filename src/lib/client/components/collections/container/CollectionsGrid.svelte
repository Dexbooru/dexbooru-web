<script lang="ts">
	import { POSTS_GRID_ANIMATION_DURATION_MS } from '$lib/client/constants/posts';
	import { getCollectionPage, getNsfwCollectionPage } from '$lib/client/helpers/context';
	import { flip } from 'svelte/animate';
	import CollectionCard from '../card/CollectionCard.svelte';

	type Props = {
		useNsfwPosts?: boolean;
	};
	let { useNsfwPosts }: Props = $props();

	const collectionPage = getCollectionPage();
	const nsfwCollectionPage = getNsfwCollectionPage();
</script>

{#if (useNsfwPosts ? $nsfwCollectionPage : $collectionPage).length > 0}
	<div
		class="grid grid-cols-1 {useNsfwPosts && 'place-items-left'} {!useNsfwPosts &&
			'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'} gap-4 auto-rows-min"
	>
		{#each useNsfwPosts ? $nsfwCollectionPage : $collectionPage as collection (collection)}
			<div animate:flip={{ duration: POSTS_GRID_ANIMATION_DURATION_MS }}>
				<CollectionCard {collection} />
			</div>
		{/each}
	</div>
{:else}
	<div class="w-full h-full grid place-items-center">
		<p class="text-6xl dark:text-white">No collections found</p>
		{#if (useNsfwPosts ? $nsfwCollectionPage : $collectionPage).length === 0}
			<!-- <PostPaginator /> -->
		{/if}
	</div>
{/if}
