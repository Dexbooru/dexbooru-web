<script lang="ts">
	import { run } from 'svelte/legacy';

	import { page } from '$app/stores';
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const artistName = $page.params.name;

	run(() => {
		updatePostStores(data);
	});
</script>

<PostWrapper postsSection="Posts with the artist: {artistName}" />
