<script lang="ts">
	import { page } from '$app/stores';
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const tagName = $page.params.name;

	$effect(() => {
		updatePostStores(data);
	});
</script>

<PostWrapper postsSection="Posts with the tag: {tagName}" />
