<script lang="ts">
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import { clearToken, storeToken } from '$lib/client/helpers/auth';
	import {
		originalPostsPageStore,
		postPaginationStore,
		postsPageStore
	} from '$lib/client/stores/posts';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	onMount(() => {
		clearToken();
		storeToken();
	});

	$: {
		postPaginationStore.set(data);
		postsPageStore.set(data.posts);
		originalPostsPageStore.set(data.posts);
	}
</script>

<PostWrapper postsSection="Home" />
