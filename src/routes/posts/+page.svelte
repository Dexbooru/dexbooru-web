<script lang="ts">
	import PostsWrapper from '$lib/client/components/posts/container/PostsWrapper.svelte';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/posts';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	$effect(() => {
		updatePostStores(data);
	});
</script>

<PostsWrapper
	postsSection="Posts ordered by {ORDER_BY_TRANSLATION_MAP[data.orderBy]?.find(({ isActive }) =>
		isActive?.(data.orderBy, data.ascending),
	)?.label}"
/>
