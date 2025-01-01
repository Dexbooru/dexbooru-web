<script lang="ts">
	import { page } from '$app/state';
	import CollectionCreateDrawer from '$lib/client/components/collections/CollectionCreateDrawer.svelte';
	import PostGrid from '$lib/client/components/posts/container/PostGrid.svelte';
	import PostPageSidebar from '$lib/client/components/posts/container/PostPageSidebar.svelte';
	import PostPaginator from '$lib/client/components/posts/container/PostPaginator.svelte';
	import { LABEL_METADATA_MODAL_NAME } from '$lib/client/constants/layout';
	import { CLEAR_INPUT_INTERVAL_MS } from '$lib/client/constants/search';
	import { getActiveModal, getOriginalPostsPage, getPostsPage } from '$lib/client/helpers/context';
	import { getUniqueLabelsFromPosts } from '$lib/shared/helpers/labels';
	import { Button } from 'flowbite-svelte';
	import { PalleteSolid, TagSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Searchbar from '../../reusable/Searchbar.svelte';

	interface Props {
		postContainerTitle: string;
	}

	let { postContainerTitle }: Props = $props();
	let uniqueTags: string[] = $state([]);
	let uniqueArtists: string[] = $state([]);
	let collectionCreateDrawerHidden: boolean = $state(true);

	const originalPostPage = getOriginalPostsPage();
	const postsPage = getPostsPage();
	const activeModal = getActiveModal();

	const getPageLabelType = (): 'tag' | 'artist' | null => {
		if (page.url.pathname.includes('/posts/tag')) return 'tag';
		if (page.url.pathname.includes('/posts/artist')) return 'artist';
		return null;
	};

	const onPostSearch = (query: string) => {
		const cleanedQuery = query.toLocaleLowerCase().trim();
		const filteredPosts = $originalPostPage.filter((post) => {
			const tagHasQuery = post.tags
				.map((tag) => tag.name)
				.find((tagName) => tagName.toLocaleLowerCase().includes(cleanedQuery));
			const artistHasQuery = post.artists
				.map((artist) => artist.name)
				.find((artistName) => artistName.toLocaleLowerCase().includes(cleanedQuery));

			return tagHasQuery || artistHasQuery;
		});

		postsPage.set(filteredPosts);
	};

	const postPageStoreUnsubscribe = postsPage.subscribe((updatedPosts) => {
		uniqueTags = getUniqueLabelsFromPosts(updatedPosts, 'tag');
		uniqueArtists = getUniqueLabelsFromPosts(updatedPosts, 'artist');
	});

	onMount(() => {
		const searchInput = document.querySelector('#post-page-searchbar') as HTMLInputElement;

		const postSearchResetTimeoutId = setInterval(() => {
			if (get(postsPage) === get(originalPostPage)) return;
			if (searchInput && !searchInput.value) {
				postsPage.set(get(originalPostPage));
			}
		}, CLEAR_INPUT_INTERVAL_MS);

		return () => {
			clearInterval(postSearchResetTimeoutId);
			postPageStoreUnsubscribe();
		};
	});
</script>

<main id="post-container" class="mt-5">
	<div id="post-container-sidebar">
		<PostPageSidebar {uniqueTags} {uniqueArtists} />
	</div>
	<div id="post-container-body" class="space-y-4 mb-5">
		<div id="post-container-title" class="block space-y-3">
			<h1 class="text-4xl dark:text-white">{postContainerTitle}</h1>
			<div class="flex flex-row space-x-2">
				{#if (page.data.posts ?? []).length > 0}
					<Searchbar
						inputElementId="post-page-searchbar"
						width="25rem"
						queryInputHandler={onPostSearch}
						placeholder="Search by tag/artist keyword(s) on this page"
					/>
				{/if}
				{#if ['/posts/tag', '/posts/artist'].some( (path) => page.url.pathname.includes(path), ) && getPageLabelType()}
					<Button
						on:click={() =>
							activeModal.set({
								focusedModalName: LABEL_METADATA_MODAL_NAME,
								modalData: { labelType: getPageLabelType() },
								isOpen: true,
							})}
						color="blue"
					>
						{#if getPageLabelType() === 'tag'}
							<TagSolid class="mr-2" />
						{:else}
							<PalleteSolid class="mr-2" />
						{/if}
						View metadata for this {getPageLabelType()}</Button
					>
				{/if}
			</div>
		</div>
		<PostGrid />
		{#if $postsPage.length > 0 && $originalPostPage.length > 0}
			<PostPaginator />
		{/if}
	</div>
</main>
<CollectionCreateDrawer bind:isHidden={collectionCreateDrawerHidden} />

<style>
	#post-container {
		display: grid;
		grid-template-columns: repeat(4.5, 1fr);
		grid-template-rows: 0fr repeat(4, 1fr);
		grid-column-gap: 0px;
		grid-row-gap: 0px;
	}

	#post-container-sidebar {
		grid-area: 1 / 1 / 6 / 2;
		align-self: start;
	}

	#post-container-body {
		grid-area: 2 / 2 / 6 / 25;
	}

	@media screen and (max-width: 767px) {
		#post-container,
		#post-container-body {
			display: block;
			margin-left: auto;
			margin-right: auto;
		}

		#post-container-sidebar {
			display: none;
		}

		#post-container-title {
			text-align: center;
		}
	}
</style>
