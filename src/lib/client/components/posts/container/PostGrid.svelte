<script lang="ts">
	import { page } from '$app/state';
	import PostCard from '$lib/client/components/posts/card/PostCard.svelte';
	import { POSTS_GRID_ANIMATION_DURATION_MS } from '$lib/client/constants/posts';
	import {
		getBlacklistedPostPage,
		getNsfwPostPage,
		getPostPaginationData,
		getPostsPage,
	} from '$lib/client/helpers/context';
	import { flip } from 'svelte/animate';
	import PostPaginator from './PostPaginator.svelte';

	interface Props {
		useHiddenPosts?: boolean;
		useNsfwPosts?: boolean;
	}

	let { useHiddenPosts = false, useNsfwPosts = false }: Props = $props();

	const postPaginationData = getPostPaginationData();
	const postPage = getPostsPage();
	const nsfwPostPage = getNsfwPostPage();
	const blacklistedPostPage = getBlacklistedPostPage();
</script>

{#if (!$postPaginationData ? (page.data.posts ?? []) : useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPage).length > 0}
	<div
		class="grid grid-cols-1 {(useHiddenPosts || useNsfwPosts) &&
			'place-items-left'} {!useHiddenPosts &&
			!useNsfwPosts &&
			'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'} gap-4 auto-rows-min"
	>
		{#each !$postPaginationData ? (page.data.posts ?? []) : useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPage as post (post.id)}
			<div animate:flip={{ duration: POSTS_GRID_ANIMATION_DURATION_MS }}>
				<PostCard {post} />
			</div>
		{/each}
	</div>
{:else}
	<div class="flex flex-col space-y-5 !mt-20">
		<p class="text-6xl dark:text-white text-center">No posts found</p>
		{#if (!$postPaginationData ? (page.data.posts ?? []) : useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPage).length === 0}
			<PostPaginator />
		{/if}
	</div>
{/if}
