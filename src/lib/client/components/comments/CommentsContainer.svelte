<script lang="ts">
	import { createPostCommentsPaginator } from '$lib/client/api/comments';
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import { MAXIMUM_COMMENTS_PER_PAGE } from '$lib/shared/constants/comments';
	import CommentTree from '$lib/shared/helpers/comments';
	import type { TComment } from '$lib/shared/types/comments';
	import { Button } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import Comment from './Comment.svelte';

	type Props = {
		postId: string;
		postCommentCount: number;
	};

	let { postId, postCommentCount = $bindable() }: Props = $props();

	let noMoreComments = $state(false);
	let topLevelComments: TComment[] = $state([]);
	let commentsLoading = false;
	let loadMoreButtonText = $state('Load comments');

	const commentTree = getCommentTree();
	const user = getAuthenticatedUser();
	const rootLevelCommentLoader = createPostCommentsPaginator(postId, null, commentTree);

	const handleLoadMoreCommentsClick = async () => {
		commentsLoading = true;
		const paginationData = await rootLevelCommentLoader();
		commentsLoading = false;

		const { pageNumber, noMoreComments: noMoreCommentsResult } = paginationData;
		loadMoreButtonText = pageNumber > 0 ? 'Load more comments' : 'Load comments';
		noMoreComments = noMoreCommentsResult;
	};

	const commentTreeUnsubscribe = commentTree.subscribe((currentCommentTree) => {
		topLevelComments = currentCommentTree.getReplies('root');
		if (currentCommentTree.getCount() > 0) {
			postCommentCount = currentCommentTree.getCount();
		}
	});

	onMount(() => {
		if (postCommentCount > 0) handleLoadMoreCommentsClick();

		return () => {
			commentTree.set(new CommentTree());
			commentTreeUnsubscribe();
		};
	});
</script>

{#if $commentTree.getCount() > 0}
	<section class="ml-2">
		{#each topLevelComments as comment (comment.id)}
			<Comment currentDepth={1} {comment} />
		{/each}

		{#if !noMoreComments && topLevelComments.length % MAXIMUM_COMMENTS_PER_PAGE === 0}
			<Button on:click={() => handleLoadMoreCommentsClick()} color="blue" class="mt-2"
				>{loadMoreButtonText}</Button
			>
		{/if}
	</section>
{:else if postCommentCount === 0}
	<div class="flex justify-left p-2">
		<p class="text-gray-500 dark:text-gray-400 text-lg italic">
			No comments found.
			{#if $user}
				Be the first to comment!
			{/if}
		</p>
	</div>
{/if}
