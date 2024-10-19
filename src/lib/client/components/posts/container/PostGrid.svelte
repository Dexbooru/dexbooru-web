<script lang="ts">
	import PostCard from '$lib/client/components/posts/card/PostCard.svelte';
	import {
		getBlacklistedPostPage,
		getNsfwPostPage,
		getPostsPage,
	} from '$lib/client/helpers/context';
	import PostPaginator from './PostPaginator.svelte';

	export let useHiddenPosts: boolean = false;
	export let useNsfwPosts: boolean = false;

	const postPageStore = getPostsPage();
	const nsfwPostPage = getNsfwPostPage();
	const blacklistedPostPage = getBlacklistedPostPage();
</script>

{#if (useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPageStore).length > 0}
	<div
		class="grid sm:grid-cols-1 sm:place-items-center {(useHiddenPosts || useNsfwPosts) &&
			'place-items-left'} {!useHiddenPosts &&
			!useNsfwPosts &&
			'md:place-items-start md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'} gap-4 auto-rows-min"
	>
		{#each useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPageStore as post (post)}
			<PostCard {post} />
		{/each}
	</div>
{:else}
	<div class="w-full h-full grid place-items-center">
		<p class="text-6xl dark:text-white">No posts found</p>
		{#if (useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPageStore).length === 0}
			<PostPaginator />
		{/if}
	</div>
{/if}
