<script lang="ts">
	import PostContainer from '$lib/client/components/posts/container/PostContainer.svelte';
	import { postsPageStore } from '$lib/client/stores/posts';
	import type { IPost, TPostOrderByColumn } from '$lib/shared/types/posts';

	export let postProps: {
		posts: IPost[];
		pageNumber: number;
		orderBy: TPostOrderByColumn;
		ascending: boolean;
	};
	export let postsSection: string;

	const { posts, pageNumber, orderBy, ascending } = postProps;
	const postPageTitle = `${postsSection} - Page ${pageNumber + 1}`;

	postsPageStore.set(posts);
</script>

<svelte:head>
	<title>{postPageTitle}</title>
</svelte:head>

<PostContainer postContainerTitle={postPageTitle} {pageNumber} {orderBy} {ascending} />
