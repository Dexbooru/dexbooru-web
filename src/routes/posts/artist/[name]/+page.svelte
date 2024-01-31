<script lang="ts">
	import { page } from '$app/stores';
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import {
		originalPostsPageStore,
		postPaginationStore,
		postsPageStore
	} from '$lib/client/stores/posts';
	import type { PageData } from './$types';

	export let data: PageData;
	const artistName = $page.params.name;

	$: {
		postPaginationStore.set(data);
		postsPageStore.set(data.posts);
		originalPostsPageStore.set(data.posts);
	}
</script>

<PostWrapper postsSection="Posts with the artist: {artistName}" />
