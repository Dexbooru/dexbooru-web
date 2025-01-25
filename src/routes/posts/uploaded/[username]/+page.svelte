<script lang="ts">
	import PostsWrapper from '$lib/client/components/posts/container/PostsWrapper.svelte';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
	let authorName: string = $state('');

	$effect(() => {
		updatePostStores(data);
		authorName = data.author;
	});
</script>

<PostsWrapper postsSection="Uploaded Posts from {authorName}" />
