<script lang="ts">
	import type { IPost, TPostOrderByColumn } from '$lib/shared/types/posts';
	import PostGrid from '$lib/client/components/posts/PostGrid.svelte';
	import PostPaginator from '$lib/client/components/posts/PostPaginator.svelte';
	import PostPageSidebar from '$lib/client/components/posts/PostPageSidebar.svelte';
	import { getUniqueLabelsFromPosts } from '$lib/shared/helpers/labels';

	export let postContainerTitle: string;
	export let pageNumber: number;
	export let orderBy: TPostOrderByColumn;
	export let ascending: boolean;
	export let posts: IPost[];

	const uniqueTags = getUniqueLabelsFromPosts(posts, 'tag');
	const uniqueArtists = getUniqueLabelsFromPosts(posts, 'artist');
</script>

<main id="post-container" class="mt-5">
	<div id="post-container-title">
		<p class="text-4xl dark:text-white">{postContainerTitle}</p>
	</div>
	<div id="post-container-body" class="space-y-4 mb-5">
		<PostGrid {posts} />
		<PostPaginator />
	</div>
	<div id="post-container-sidebar">
		<PostPageSidebar {pageNumber} {orderBy} {ascending} {uniqueTags} {uniqueArtists} />
	</div>
</main>

<style>
	#post-container {
		display: grid;
		grid-template-columns: repeat(4.5, 1fr);
		grid-template-rows: 0.2fr repeat(4, 1fr);
		grid-column-gap: 0px;
		grid-row-gap: 0px;
	}

	#post-container-title {
		grid-area: 1 / 2 / 2 / 3;
	}

	#post-container-sidebar {
		grid-area: 1 / 1 / 6 / 2;
		position: sticky;
		top: 4.5rem;
		align-self: start;
	}

	#post-container-body {
		grid-area: 2 / 2 / 6 / 5;
	}
</style>
