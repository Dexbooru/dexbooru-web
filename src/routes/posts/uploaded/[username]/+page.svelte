<script lang="ts">
	import { run } from 'svelte/legacy';

	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let authorName: string = $state('');

	run(() => {
		updatePostStores(data);
		authorName = data.author;
	});
</script>

<PostWrapper postsSection="Uploaded Posts from {authorName}" />
