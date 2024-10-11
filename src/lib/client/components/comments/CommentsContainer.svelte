<script lang="ts">
	import { createPostCommentsPaginator } from '$lib/client/api/comments';
	import { commentTreeStore } from '$lib/client/stores/comments';
	import CommentTree from '$lib/shared/helpers/comments';
	import type { IComment } from '$lib/shared/types/comments';
	import { Button, Spinner } from 'flowbite-svelte';
	import { onDestroy, onMount } from 'svelte';
	import Comment from './Comment.svelte';

	export let postId: string;
	export let postCommentCount: number;

	let noMoreComments = false;
	let topLevelComments: IComment[] = [];
	let commentsLoading = false;
	let loadMoreButtonText = 'Load comments';

	const rootLevelCommentLoader = createPostCommentsPaginator(postId, null);

	const handleLoadMoreCommentsClick = async (isInitialLoad: boolean = false) => {
		commentsLoading = true;
		const paginationData = await rootLevelCommentLoader(isInitialLoad);
		commentsLoading = false;

		const { pageNumber, noMoreComments: noMoreCommentsResult } = paginationData;
		loadMoreButtonText = pageNumber > 0 ? 'Load more comments' : 'Load comments';
		noMoreComments = noMoreCommentsResult;
	};

	const commentTreeUnsubscribe = commentTreeStore.subscribe((currentCommentTree) => {
		topLevelComments = currentCommentTree.getReplies('root');
	});

	onMount(() => {
		postCommentCount > 0 && handleLoadMoreCommentsClick(true);
	});

	onDestroy(() => {
		commentTreeStore.set(new CommentTree());
		commentTreeUnsubscribe();
	});
</script>

{#if commentsLoading}
	<Spinner size="lg" />
{:else if postCommentCount > 0 || $commentTreeStore.getCount() > 0}
	<section class="ml-2">
		{#each topLevelComments as comment (comment.id)}
			<Comment currentDepth={1} {comment} />
		{/each}		

		{#if !noMoreComments}
			<Button on:click={() => handleLoadMoreCommentsClick(false)} color="blue" class="mt-2"
				>{loadMoreButtonText}</Button
			>
		{/if}
	</section>
{:else if postCommentCount === 0}
	<div class="flex justify-left p-2">
		<p class="text-gray-500 dark:text-gray-400 text-lg italic">
			No comments found. Be the first to comment!
		</p>
	</div>
{/if}
