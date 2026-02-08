<script lang="ts">
	import { page } from '$app/state';
	import PostCard from '$lib/client/components/posts/card/PostCard.svelte';
	import {
		getBlacklistedPostPage,
		getNsfwPostPage,
		getPostPaginationData,
		getPostsPage,
	} from '$lib/client/helpers/context';
	import CardPlaceholder from 'flowbite-svelte/CardPlaceholder.svelte';
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
	<div class="grid auto-rows-min grid-cols-1 gap-4 p-3 sm:grid-cols-3">
		{#if $postPaginationData}
			{#each useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPage as post (post.id)}
				<PostCard {post} />
			{/each}
		{:else}
			{#each Array(page.data.posts?.length).fill(0) as _, _i (_i)}
				<CardPlaceholder size="md" />
			{/each}
		{/if}
	</div>
{:else}
	<div class="mt-20 flex flex-col space-y-5">
		<p class="text-center text-6xl dark:text-white">No posts found</p>
		{#if (!$postPaginationData ? (page.data.posts ?? []) : useHiddenPosts ? $blacklistedPostPage : useNsfwPosts ? $nsfwPostPage : $postPage).length === 0}
			<PostPaginator />
		{/if}
	</div>
{/if}
