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
			'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} auto-rows-min gap-4"
	>
		{#if $collectionPaginationData}
			{#if (useNsfwPosts ? $nsfwCollectionPage : $collectionPage).length > 0}
				{#each useNsfwPosts ? $nsfwCollectionPage : $collectionPage as collection (collection.id)}
					<CollectionCard {collection} />
				{/each}
			{/if}
		{:else}
			{#each Array((page.data.collections ?? []).length).fill(0) as _, _i (_i)}
				<CardPlaceholder size="md" />
			{/each}
		{/if}
	</div>
{:else}
	<div class="grid h-full w-full place-items-center">
		<p class="text-6xl dark:text-white">No collections found</p>
		{#if (useNsfwPosts ? $nsfwCollectionPage : $collectionPage).length === 0}
			<CollectionPaginator />
		{/if}
	</div>
{/if}
