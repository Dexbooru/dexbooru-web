<script lang="ts">
	import PostGrid from '$lib/client/components/posts/container/PostGrid.svelte';
	import PostPageSidebar from '$lib/client/components/posts/container/PostPageSidebar.svelte';
	import PostPaginator from '$lib/client/components/posts/container/PostPaginator.svelte';
	import { postsPageStore } from '$lib/client/stores/posts';
	import { getUniqueLabelsFromPosts } from '$lib/shared/helpers/labels';
	import type { TPostOrderByColumn } from '$lib/shared/types/posts';
	import { onDestroy } from 'svelte';
	import Searchbar from '../../reusable/Searchbar.svelte';

	export let postContainerTitle: string;
	export let pageNumber: number;
	export let orderBy: TPostOrderByColumn;
	export let ascending: boolean;

	const originalPosts = $postsPageStore;

	const onPostSearch = (query: string) => {
		const cleanedQuery = query.toLocaleLowerCase().trim();

		const filteredPosts = originalPosts.filter((post) => {
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

	let uniqueTags = getUniqueLabelsFromPosts(originalPosts, 'tag');
	let uniqueArtists = getUniqueLabelsFromPosts(originalPosts, 'artist');

	const postPageStoreUnsubscribe = postsPageStore.subscribe((updatedPosts) => {
		uniqueTags = getUniqueLabelsFromPosts(updatedPosts, 'tag');
		uniqueArtists = getUniqueLabelsFromPosts(updatedPosts, 'artist');
	});

	onDestroy(() => {
		postPageStoreUnsubscribe();
	});
</script>

<main id="post-container" class="mt-5">
	<div id="post-container-sidebar">
		<PostPageSidebar {orderBy} {ascending} {uniqueTags} {uniqueArtists} />
	</div>
	<div id="post-container-body" class="space-y-4 mb-5">
		<div id="post-container-title" class="flex justify-between">
			<p class="text-4xl dark:text-white">{postContainerTitle}</p>
			<Searchbar queryHandler={onPostSearch} placeholder="Search by keyword(s)" />
		</div>

		<PostGrid />
		<PostPaginator {pageNumber} {orderBy} />
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
