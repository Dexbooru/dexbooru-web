<script lang="ts">
	import PostContainer from '$lib/client/components/posts/PostContainer.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { posts, pageNumber, orderBy, ascending } = data;

	const postPageTitle = `Posts - Page ${pageNumber + 1}`;
</script>

<svelte:head>
	<title>{postPageTitle}</title>
</svelte:head>

<PostContainer postContainerTitle={postPageTitle} {posts} {pageNumber} {orderBy} {ascending} />
