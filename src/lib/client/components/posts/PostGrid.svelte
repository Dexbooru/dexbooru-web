<script lang="ts">
	import PostCard from '$lib/client/components/posts/PostCard.svelte';
	import { POSTS_GRID_ANIMATION_DURATION_MS } from '$lib/client/constants/posts';
	import { postsPageStore } from '$lib/client/stores/posts';
	import { flip } from 'svelte/animate';
</script>

<div class="grid place-items-center grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mx-auto">
	{#each $postsPageStore as post (post)}
		<div animate:flip={{ duration: POSTS_GRID_ANIMATION_DURATION_MS }}>
			<PostCard {post} />
		</div>
	{/each}
</div>
