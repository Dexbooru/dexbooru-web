<script lang="ts">
	import { page } from '$app/stores';
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	export let data: PageData;
	const artistName = $page.params.name;

	$: {
		updatePostStores(data);
	}
</script>

<PostWrapper postsSection="Posts with the artist: {artistName}" />
