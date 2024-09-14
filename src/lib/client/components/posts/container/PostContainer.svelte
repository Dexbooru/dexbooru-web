<script lang="ts">
	import PostGrid from '$lib/client/components/posts/container/PostGrid.svelte';
	import PostPageSidebar from '$lib/client/components/posts/container/PostPageSidebar.svelte';
	import PostPaginator from '$lib/client/components/posts/container/PostPaginator.svelte';
	import { originalPostsPageStore, postsPageStore } from '$lib/client/stores/posts';
	import { getUniqueLabelsFromPosts } from '$lib/shared/helpers/labels';
	import { onDestroy, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Searchbar from '../../reusable/Searchbar.svelte';

	export let postContainerTitle: string;

	const CLEAR_INPUT_INTERVAL_MS: number = 1000;

	const onPostSearch = (query: string) => {
		const cleanedQuery = query.toLocaleLowerCase().trim();

		const filteredPosts = $originalPostsPageStore.filter((post) => {
			const tagHasQuery = post.tags
				.map((tag) => tag.name)
				.find((tagName) => tagName.toLocaleLowerCase().includes(cleanedQuery));
			const artistHasQuery = post.artists
				.map((artist) => artist.name)
				.find((artistName) => artistName.toLocaleLowerCase().includes(cleanedQuery));
			const descriptionHasQuery = post.description.toLocaleLowerCase().includes(cleanedQuery);
			const uploaderHasQuery = post.author.username.toLocaleLowerCase().includes(cleanedQuery);

			return tagHasQuery || artistHasQuery || descriptionHasQuery || uploaderHasQuery;
		});

		postsPageStore.set(filteredPosts);
	};

	let uniqueTags: string[] = [];
	let uniqueArtists: string[] = [];

	const postPageStoreUnsubscribe = postsPageStore.subscribe((updatedPosts) => {
		uniqueTags = getUniqueLabelsFromPosts(updatedPosts, 'tag');
		uniqueArtists = getUniqueLabelsFromPosts(updatedPosts, 'artist');
	});

	onMount(() => {
		const searchInput = document.querySelector(
			'input[placeholder="Search by keyword(s)"]'
		) as HTMLInputElement;

		const postSearchResetTimeoutId = setInterval(() => {
			if (searchInput && !searchInput.value) {
				postsPageStore.set(get(originalPostsPageStore));
			}
		}, CLEAR_INPUT_INTERVAL_MS);

		return () => {
			clearInterval(postSearchResetTimeoutId);
		};
	});

	onDestroy(() => {
		postPageStoreUnsubscribe();
	});
</script>

<main id="post-container" class="mt-5">
	<div id="post-container-sidebar">
		<PostPageSidebar {uniqueTags} {uniqueArtists} />
	</div>
	<div id="post-container-body" class="space-y-4 mb-5">
		<div id="post-container-title" class="flex justify-between">
			<p class="text-4xl dark:text-white">{postContainerTitle}</p>
			{#if $postsPageStore.length > 0}
				<PostPaginator />
			{/if}
			<Searchbar queryInputHandler={onPostSearch} placeholder="Search by keyword(s)" />
		</div>
		<PostGrid />
		{#if $postsPageStore.length > 0}
			<PostPaginator />
		{/if}
	</div>
</main>

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
