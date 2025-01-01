<script lang="ts">
	import { page } from '$app/state';
	import {
		getCollectionPage,
		getCollectionPaginationData,
		getNsfwCollectionPage,
	} from '$lib/client/helpers/context';
	import CollectionCard from '../card/CollectionCard.svelte';
	import CollectionPaginator from './CollectionPaginator.svelte';

	type Props = {
		useNsfwPosts?: boolean;
	};
	let { useNsfwPosts }: Props = $props();

	const collectionPaginationData = getCollectionPaginationData();
	const collectionPage = getCollectionPage();
	const nsfwCollectionPage = getNsfwCollectionPage();
</script>

{#if (!$collectionPaginationData ? (page.data.collections ?? []) : useNsfwPosts ? $nsfwCollectionPage : $collectionPage).length > 0}
	<div
		class="grid grid-cols-1 {useNsfwPosts && 'place-items-left'} {!useNsfwPosts &&
			'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'} gap-4 auto-rows-min"
	>
		{#each !$collectionPaginationData ? (page.data.collections ?? []) : useNsfwPosts ? $nsfwCollectionPage : $collectionPage as collection (collection)}
			<CollectionCard {collection} />
		{/each}
	</div>
{:else}
	<div class="w-full h-full grid place-items-center">
		<p class="text-6xl dark:text-white">No collections found</p>
		{#if (!$collectionPaginationData ? (page.data.collections ?? []) : useNsfwPosts ? $nsfwCollectionPage : $collectionPage).length === 0}
			<CollectionPaginator />
		{/if}
	</div>
{/if}
