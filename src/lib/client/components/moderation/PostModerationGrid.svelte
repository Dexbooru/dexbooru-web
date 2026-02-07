<script lang="ts">
	import type { TPost } from '$lib/shared/types/posts';
	import { getModerationPaginationData } from '$lib/client/helpers/context';
	import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
	import Button from 'flowbite-svelte/Button.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
	import { onMount } from 'svelte';
	import PostModerationCard from './PostModerationCard.svelte';

	type Props = {
		handleLoadMorePosts: () => void;
		loadingPosts?: boolean;
		containerId: string;
	};

	let { handleLoadMorePosts, loadingPosts = false, containerId }: Props = $props();
	let posts = $state<TPost[]>([]);

	const moderationData = getModerationPaginationData();

	const moderationDataUnsubscribe = moderationData.subscribe((data) => {
		if (data) {
			posts = data.pendingPosts ?? [];
		}
	});

	onMount(() => {
		return () => {
			moderationDataUnsubscribe();
		};
	});
</script>

{#if posts.length === 0 && !loadingPosts}
	<div
		class="flex flex-col justify-center items-center py-20 text-center bg-gray-50 dark:bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700"
	>
		<div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
			<ExclamationCircleSolid class="w-12 h-12 text-gray-400" />
		</div>
		<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">No pending posts</h3>
		<p class="text-gray-500 dark:text-gray-400 max-w-sm">
			All new posts have been reviewed. Great job!
		</p>
	</div>
{:else}
	<section id={containerId} class="space-y-8">
		<div
			class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
		>
			{#each posts as post (post.id)}
				<PostModerationCard {post} />
			{/each}
		</div>

		{#if loadingPosts}
			<div class="flex justify-center items-center py-8">
				<Spinner class="w-10 h-10 text-primary-500" />
			</div>
		{:else if posts.length >= MAXIMUM_POSTS_PER_PAGE}
			<div class="flex justify-center pt-4">
				<Button color="blue" onclick={handleLoadMorePosts} class="px-10">Load more posts</Button>
			</div>
		{/if}
	</section>
{/if}
