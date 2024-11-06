<script lang="ts">
	import { page } from '$app/stores';
	import { CLEAR_INPUT_INTERVAL_MS } from '$lib/client/constants/search';
	import {
		getAuthenticatedUser,
		getCollectionPage,
		getCollectionPaginationData,
		getOriginalCollectionPage,
	} from '$lib/client/helpers/context';
	import { applyLazyLoadingOnImageClass } from '$lib/client/helpers/dom';
	import { Button } from 'flowbite-svelte';
	import { PlusSolid } from 'flowbite-svelte-icons';
	import { onDestroy, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import Searchbar from '../../reusable/Searchbar.svelte';
	import CollectionCreateDrawer from '../CollectionCreateDrawer.svelte';
	import CollectionPageSidebar from './CollectionPageSidebar.svelte';
	import CollectionsGrid from './CollectionsGrid.svelte';

	type Props = {
		collectionContainerTitle: string;
	};
	let { collectionContainerTitle }: Props = $props();
	let collectionCreateDrawerHidden: boolean = $state(true);
	let uniqueAuthors: { id: string; username: string; profilePictureUrl: string }[] = $state([]);

	const user = getAuthenticatedUser();
	const collectionPage = getCollectionPage();
	const originalCollectionPage = getOriginalCollectionPage();
	const collectionPaginationData = getCollectionPaginationData();
	const pathname = $page.url.pathname;
	const collectionsUsername = $page.params.username;

	const onCollectionSearch = (query: string) => {
		const cleanedQuery = query.toLocaleLowerCase().trim();

		const filteredCollections = $originalCollectionPage.filter((collection) => {
			const titleHasQuery = collection.title.toLocaleLowerCase().includes(cleanedQuery);
			const descriptionHasQuery = collection.description.toLocaleLowerCase().includes(cleanedQuery);
			const uploaderHasQuery = collection.author.username
				.toLocaleLowerCase()
				.includes(cleanedQuery);

			return titleHasQuery || descriptionHasQuery || uploaderHasQuery;
		});

		collectionPage.set(filteredCollections);
	};

	const collectionPaginationDataUnsubscribe = collectionPaginationData.subscribe((data) => {
		if (data) {
			applyLazyLoadingOnImageClass('collection-preview-image');
			applyLazyLoadingOnImageClass('booru-avatar-collection-card');
		}
	});

	const collectionPageUnsubscribe = collectionPage.subscribe((collections) => {
		const collectionAuthorMap = new Map<
			string,
			{ id: string; username: string; profilePictureUrl: string }
		>();
		collections.forEach((collection) => {
			collectionAuthorMap.set(collection.author.id, collection.author);
		});

		uniqueAuthors = Array.from(collectionAuthorMap.values());
	});

	onMount(() => {
		applyLazyLoadingOnImageClass('collection-preview-image');
		applyLazyLoadingOnImageClass('booru-avatar-collection-card');

		const searchInput = document.querySelector('#collection-page-searchbar') as HTMLInputElement;

		const collectionSearchResetTimeoutId = setInterval(() => {
			if (get(collectionPage) === get(originalCollectionPage)) return;
			if (searchInput && !searchInput.value) {
				collectionPage.set(get(originalCollectionPage));
			}
		}, CLEAR_INPUT_INTERVAL_MS);

		return () => {
			clearInterval(collectionSearchResetTimeoutId);
		};
	});

	onDestroy(() => {
		collectionPageUnsubscribe();
		collectionPaginationDataUnsubscribe();
	});
</script>

<main in:fade id="collection-container" class="mt-5">
	<div id="collection-container-sidebar">
		<CollectionPageSidebar {uniqueAuthors} />
	</div>
	<div id="collection-container-body" class="space-y-4 mb-5">
		<div id="collection-container-title" class="block space-y-3">
			<h1 class="text-4xl dark:text-white cursor-text">{collectionContainerTitle}</h1>
			<div class="flex">
				<Searchbar
					inputElementId="collection-page-searchbar"
					width="25rem"
					queryInputHandler={onCollectionSearch}
					placeholder="Search by keyword(s) on this page"
				/>
				{#if $user && (pathname === '/collections' || pathname === '/collections/created' || (pathname.includes('collections/users') && collectionsUsername === $user.username))}
					<Button on:click={() => (collectionCreateDrawerHidden = false)}>
						Create collection
						<PlusSolid class="ml-3" />
					</Button>
				{/if}
			</div>
		</div>
		<CollectionsGrid />
		{#if $collectionPage.length > 0}
			<!-- <PostPaginator /> -->
		{/if}
	</div>
</main>
<CollectionCreateDrawer bind:isHidden={collectionCreateDrawerHidden} />

<style>
	#collection-container {
		display: grid;
		grid-template-columns: repeat(4.5, 1fr);
		grid-template-rows: 0fr repeat(4, 1fr);
		grid-column-gap: 0px;
		grid-row-gap: 0px;
	}

	#collection-container-sidebar {
		grid-area: 1 / 1 / 6 / 2;
		align-self: start;
	}

	#collection-container-body {
		grid-area: 2 / 2 / 6 / 25;
	}

	@media screen and (max-width: 767px) {
		#collection-container,
		#collection-container-body {
			display: block;
			margin-left: auto;
			margin-right: auto;
		}

		#collection-container-sidebar {
			display: none;
		}

		#collection-container-title {
			text-align: center;
		}
	}
</style>
