<script lang="ts">
	import type { TPost } from '$lib/shared/types/posts';
	import { getModerationPaginationData } from '$lib/client/helpers/context';
	import {
		getModerationGridColumnCount,
		MODERATION_GRID_ROW_ESTIMATED_HEIGHT,
		MODERATION_VIRTUAL_LIST_HEIGHT,
	} from '$lib/client/helpers/moderation';
	import { chunkArray } from '$lib/shared/helpers/util';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
	import { onMount } from 'svelte';
	import VirtualizedList from '../reusable/VirtualizedList.svelte';
	import PostModerationCard from './PostModerationCard.svelte';

	type Props = {
		handleLoadMorePosts: () => void | Promise<void>;
		loadingPosts?: boolean;
		hasMore?: boolean;
		containerId: string;
	};

	let { handleLoadMorePosts, loadingPosts = false, hasMore = false, containerId }: Props = $props();
	let posts = $state<TPost[]>([]);
	let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1280);
	let isLoadingMore = $state(false);

	const moderationData = getModerationPaginationData();

	const columnCount = $derived(getModerationGridColumnCount(windowWidth));
	const postRows = $derived(chunkArray(posts, columnCount));
	const canLoadMore = $derived(hasMore && !loadingPosts && !isLoadingMore);

	const moderationDataUnsubscribe = moderationData.subscribe((data) => {
		if (data) {
			posts = data.pendingPosts ?? [];
		}
	});

	const onResize = () => {
		windowWidth = window.innerWidth;
	};

	const onLoadMore = async () => {
		if (!canLoadMore) return;
		isLoadingMore = true;
		try {
			await handleLoadMorePosts();
		} finally {
			isLoadingMore = false;
		}
	};

	onMount(() => {
		windowWidth = window.innerWidth;

		return () => {
			moderationDataUnsubscribe();
		};
	});
</script>

<svelte:window onresize={onResize} />

{#if posts.length === 0 && loadingPosts}
	<div class="flex items-center justify-center py-20">
		<Spinner class="text-primary-500 h-10 w-10" />
	</div>
{:else if posts.length === 0}
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
	<section id={containerId} class="space-y-4">
		<VirtualizedList
			data={postRows}
			listHeight={MODERATION_VIRTUAL_LIST_HEIGHT}
			defaultEstimatedItemHeight={MODERATION_GRID_ROW_ESTIMATED_HEIGHT}
			bufferSize={2}
			viewportLabel="Pending posts"
			{onLoadMore}
			hasMore={canLoadMore}
			loadMoreThreshold={1}
		>
			{#snippet children(row)}
				<div
					class="grid gap-6 pb-6"
					style="grid-template-columns: repeat({columnCount}, minmax(0, 1fr));"
				>
					{#each row as post (post.id)}
						<PostModerationCard {post} />
					{/each}
				</div>
			{/snippet}
		</VirtualizedList>

		{#if loadingPosts || isLoadingMore}
			<div class="flex items-center justify-center py-4">
				<Spinner class="text-primary-500 h-10 w-10" />
			</div>
		{/if}
	</section>
{/if}
