<script lang="ts">
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	export let data: PageData;

	let authorName: string = '';

	$: {
		updatePostStores(data);
		authorName = data.author;
	}
</script>

<PostWrapper postsSection="Uploaded Posts from {authorName}" />
