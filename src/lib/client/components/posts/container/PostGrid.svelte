<script lang="ts">
	import { page } from '$app/state';
	import PostCard from '$lib/client/components/posts/card/PostCard.svelte';
	import {
		getBlacklistedPostPage,
		getNsfwPostPage,
		getPostPaginationData,
		getPostsPage,
	} from '$lib/client/helpers/context';
	import { CardPlaceholder } from 'flowbite-svelte';
	import PostPaginator from './PostPaginator.svelte';

	type Props = {
		useHiddenPosts?: boolean;
		useNsfwPosts?: boolean;
	};

	let { useHiddenPosts = false, useNsfwPosts = false }: Props = $props();

	const postPaginationData = getPostPaginationData();
	const postPage = getPostsPage();
	const nsfwPostPage = getNsfwPostPage();
	const blacklistedPostPage = getBlacklistedPostPage();
</script>

{#if (page.data.posts ?? []).length > 0}
	<div
		class="p-3 sm:flex sm:flex-col md:grid lg:grid xl:grid grid-cols-1 {(useHiddenPosts ||
			useNsfwPosts) &&
			'place-items-left'} {!useHiddenPosts &&
			!useNsfwPosts &&
			'space-y-3 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'} gap-4 auto-rows-min"
	>
		{#if $postPaginationData}
			{#each useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPage as post (post.id)}
				<PostCard {post} />
			{/each}
		{:else}
			{#each Array(page.data.posts?.length).fill(0) as _, i}
				<CardPlaceholder size="md" />
			{/each}
		{/if}
	</div>
{:else}
	<div class="flex flex-col space-y-5 !mt-20">
		<p class="text-6xl dark:text-white text-center">No posts found</p>
		{#if (!$postPaginationData ? (page.data.posts ?? []) : useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPage).length === 0}
			<PostPaginator />
		{/if}
	</div>
{/if}
