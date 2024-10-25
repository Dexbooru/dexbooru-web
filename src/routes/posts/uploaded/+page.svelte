<script lang="ts">
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
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

<PostWrapper postsSection="Uploaded Posts" />
