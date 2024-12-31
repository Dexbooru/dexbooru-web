<script lang="ts">
	import { page } from '$app/state';
	import PostsWrapper from '$lib/client/components/posts/container/PostsWrapper.svelte';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	$effect(() => {
		updatePostStores(data);
	});
</script>

<PostsWrapper postsSection="Search results for: {page.url.searchParams.get('query')}" />
