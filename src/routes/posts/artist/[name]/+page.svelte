<script lang="ts">
	import { page } from '$app/stores';
	import PostsWrapper from '$lib/client/components/posts/container/PostsWrapper.svelte';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const artistName = $page.params.name;

	$effect(() => {
		updatePostStores(data);
	});
</script>

<PostsWrapper
	orderBy={data.orderBy}
	pageNumber={data.pageNumber}
	ascending={data.ascending}
	posts={data.posts}
	postsSection="Posts with the artist: {artistName}"
/>
