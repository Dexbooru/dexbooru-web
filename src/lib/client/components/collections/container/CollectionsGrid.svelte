<script lang="ts">
	import { page } from '$app/state';
	import {
		getCollectionPage,
		getCollectionPaginationData,
		getNsfwCollectionPage,
		getOriginalCollectionPage,
	} from '$lib/client/helpers/context';
	import CardPlaceholder from 'flowbite-svelte/CardPlaceholder.svelte';
	import CollectionCard from '../card/CollectionCard.svelte';
	import CollectionPaginator from './CollectionPaginator.svelte';

	type Props = {
		useNsfwCollections?: boolean;
	};
	let { useNsfwCollections: useNsfwPosts }: Props = $props();

	const collectionPaginationData = getCollectionPaginationData();
	const collectionPage = getCollectionPage();
	const nsfwCollectionPage = getNsfwCollectionPage();
	const originalCollectionPage = getOriginalCollectionPage();
</script>

{#if Math.max((page.data.collections ?? []).length, $originalCollectionPage.length) > 0}
	<div
		class="grid grid-cols-1 {useNsfwPosts && 'place-items-left'} {!useNsfwPosts &&
			'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'} gap-4 auto-rows-min"
	>
		{#if $collectionPaginationData}
			{#if (useNsfwPosts ? $nsfwCollectionPage : $collectionPage).length > 0}
				{#each useNsfwPosts ? $nsfwCollectionPage : $collectionPage as collection (collection.id)}
					<CollectionCard {collection} />
				{/each}
			{/if}
		{:else}
			{#each Array((page.data.collections ?? []).length).fill(0) as _, i}
				<CardPlaceholder size="md" />
			{/each}
		{/if}
	</div>
{:else}
	<div class="w-full h-full grid place-items-center">
		<p class="text-6xl dark:text-white">No collections found</p>
		{#if (useNsfwPosts ? $nsfwCollectionPage : $collectionPage).length === 0}
			<CollectionPaginator />
		{/if}
	</div>
{/if}
