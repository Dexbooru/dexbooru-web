<script lang="ts">
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import {
		originalPostsPageStore,
		postPaginationStore,
		postsPageStore,
	} from '$lib/client/stores/posts';
	import type { PageData } from './$types';

	export let data: PageData;

	let authorName: string = '';

	$: {
		postPaginationStore.set(data);
		postsPageStore.set(data.posts);
		originalPostsPageStore.set(data.posts);
		authorName = data.author;
	}
</script>

<PostWrapper postsSection="Uploaded Posts from {authorName}" />
