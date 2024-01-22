<script lang="ts">
	import { page } from '$app/stores';
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const artistName = $page.params.name;
</script>

<PostWrapper postProps={data} postsSection="Posts with the artist: {artistName}" />
