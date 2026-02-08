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
		class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center dark:border-gray-700 dark:bg-gray-800/30"
	>
		<div class="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
			<ExclamationCircleSolid class="h-12 w-12 text-gray-400" />
		</div>
		<h3 class="mb-1 text-xl font-semibold text-gray-900 dark:text-white">No pending posts</h3>
		<p class="max-w-sm text-gray-500 dark:text-gray-400">
			All new posts have been reviewed. Great job!
		</p>
	</div>
{:else}
	<section id={containerId} class="space-y-8">
		<div
			class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each posts as post (post.id)}
				<PostModerationCard {post} />
			{/each}
		</div>

		{#if loadingPosts}
			<div class="flex items-center justify-center py-8">
				<Spinner class="text-primary-500 h-10 w-10" />
			</div>
		{:else if posts.length >= MAXIMUM_POSTS_PER_PAGE}
			<div class="flex justify-center pt-4">
				<Button color="blue" onclick={handleLoadMorePosts} class="px-10">Load more posts</Button>
			</div>
		{/if}
	</section>
{/if}
