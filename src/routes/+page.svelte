<script lang="ts">
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import { clearToken, storeToken } from '$lib/client/helpers/auth';
	import { updatePostStores } from '$lib/client/helpers/posts';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	onMount(() => {
		clearToken();
		storeToken();
	});

	$: {
		updatePostStores(data);
	}
</script>

<PostWrapper postsSection="Home" />
