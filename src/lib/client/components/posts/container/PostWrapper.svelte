<script lang="ts">
	import PostContainer from '$lib/client/components/posts/container/PostContainer.svelte';
	import { getLabelFromOrderby } from '$lib/client/constants/posts';
	import { postsPageStore } from '$lib/client/stores/posts';
	import type { IPost, TPostOrderByColumn } from '$lib/shared/types/posts';

	export let postProps: {
		posts: IPost[];
		pageNumber: number;
		orderBy: TPostOrderByColumn;
		ascending: boolean;
	};

	const { posts, pageNumber, orderBy, ascending } = postProps;
	postsPageStore.set(posts);

	const postPageTitle = `Page ${pageNumber + 1} | Ordered by ${getLabelFromOrderby(
		orderBy,
		ascending
	)}`;
</script>

<svelte:head>
	<title>{postPageTitle}</title>
</svelte:head>

<PostContainer postContainerTitle={postPageTitle} {pageNumber} {orderBy} {ascending} />
