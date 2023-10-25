<script lang="ts">
	import PostCard from '$lib/client/components/posts/PostCard.svelte';
	import type { IPost } from '$lib/shared/types/posts';

	export let posts: IPost[] = [];
</script>

<div class="grid place-items-center grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mx-auto">
	{#each posts as post (post)}
		<PostCard {post} />
	{/each}
</div>
