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

		// fetch('http://localhost:3001/api/auth/misc/health-check')
		// 	.then((response) => response.json())
		// 	.then((data) => console.log(data));
	});

	$: {
		postPaginationStore.set(data);
		postsPageStore.set(data.posts);
		originalPostsPageStore.set(data.posts);
	}
</script>

<PostWrapper postsSection="Home" />
