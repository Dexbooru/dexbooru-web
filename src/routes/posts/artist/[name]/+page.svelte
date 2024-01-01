<script lang="ts">
	import PostWrapper from '$lib/client/components/posts/container/PostWrapper.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<PostWrapper postProps={data} />
