<script lang="ts">
	import PostContainer from '$lib/client/components/posts/container/PostContainer.svelte';
	import { postsPageStore } from '$lib/client/stores/posts';
	import type { PageData } from './$types';

	export let data: PageData;
	const { posts, pageNumber, orderBy, ascending } = data;
	postsPageStore.set(posts);

	let postPageTitle: string = '';
	$: {
		postPageTitle = `${$postsPageStore.length} Post(s) - Page ${pageNumber + 1}`;
	}
</script>

<svelte:head>
	<title>{postPageTitle}</title>
</svelte:head>

<PostContainer postContainerTitle={postPageTitle} {pageNumber} {orderBy} {ascending} />
