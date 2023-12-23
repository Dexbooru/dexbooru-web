<script lang="ts">
	import PostCard from '$lib/client/components/posts/card/PostCard.svelte';
	import { POSTS_GRID_ANIMATION_DURATION_MS } from '$lib/client/constants/posts';
	import { postsPageStore } from '$lib/client/stores/posts';
	import { flip } from 'svelte/animate';
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
	{#each $postsPageStore as post (post)}
		<div class="m-2" animate:flip={{ duration: POSTS_GRID_ANIMATION_DURATION_MS }}>
			<PostCard {post} />
		</div>
	{/each}
</div>
