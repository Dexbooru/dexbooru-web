<script lang="ts">
	import { page } from '$app/state';
	import {
		getAuthenticatedUser,
		getCollectionPage,
		getOriginalCollectionPage,
	} from '$lib/client/helpers/context';

	import PlusOutline from 'flowbite-svelte-icons/PlusOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import CollectionCreateModal from '../CollectionCreateModal.svelte';
	import CollectionPageSidebar from './CollectionPageSidebar.svelte';
	import CollectionPaginator from './CollectionPaginator.svelte';
	import CollectionsGrid from './CollectionsGrid.svelte';

	type Props = {
		collectionContainerTitle: string;
	};

	let { collectionContainerTitle }: Props = $props();
	let isCollectionCreateModalOpen: boolean = $state(false);
	let uniqueAuthors: { id: string; username: string; profilePictureUrl: string }[] = $state([]);
	let currentPageQuery = $state('');

	const user = getAuthenticatedUser();
	const collectionPage = getCollectionPage();
	const originalCollectionPage = getOriginalCollectionPage();
	const pathname = page.url.pathname;
	const collectionsUsername = page.params.username;

	const collectionPageUnsubscribe = collectionPage.subscribe((collections) => {
		const collectionAuthorMap = new SvelteMap<
			string,
			{ id: string; username: string; profilePictureUrl: string }
		>();
		collections.forEach((collection) => {
			collectionAuthorMap.set(collection.author.id, collection.author);
		});

		uniqueAuthors = Array.from(collectionAuthorMap.values());
	});

	onMount(() => {
		return () => {
			collectionPageUnsubscribe();
		};
	});
</script>

<div>
	<main id="collection-container" class="mt-5">
		<div id="collection-container-sidebar">
			<CollectionPageSidebar {uniqueAuthors} />
		</div>
		<div id="collection-container-body" class="mb-5 space-y-4">
			<div id="collection-container-title" class="block space-y-3">
				<h1 class="text-lg sm:text-3xl md:text-3xl lg:text-4xl dark:text-white">
					{collectionContainerTitle}
				</h1>
				{#if $user && (pathname === '/collections' || pathname === '/collections/created' || (pathname.includes('collections/users') && collectionsUsername === $user.username))}
					<Button
						onclick={() => (isCollectionCreateModalOpen = true)}
						class="w-full sm:mr-auto sm:ml-auto sm:w-[20rem] md:mr-auto md:ml-0"
					>
						Create collection
						<PlusOutline class="ml-3" />
					</Button>
				{/if}
			</div>
			<CollectionsGrid />
			{#if $originalCollectionPage.length > 0 && currentPageQuery.length === 0}
				<CollectionPaginator />
			{/if}
		</div>
	</main>
</div>

<CollectionCreateModal bind:isOpen={isCollectionCreateModalOpen} />

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
		#collection-container-sidebar {
			display: none;
		}

		#collection-container-title {
			text-align: center;
		}

		#collection-container {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
		}

		#collection-container-body {
			grid-area: unset;
			width: 100%;
			padding: 1rem;
		}
	}
</style>
