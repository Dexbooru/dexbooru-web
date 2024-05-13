<script lang="ts">
	import { createPostCommentsPaginator } from '$lib/client/api/comments';
	import { commentTreeStore } from '$lib/client/stores/comments';
	import CommentTree from '$lib/shared/helpers/comments';
	import type { IComment } from '$lib/shared/types/comments';
	import { Button } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
	import Comment from './Comment.svelte';

	export let postId: string;

	let noMoreComments = false;
	let topLevelComments: IComment[] = [];
	let commentsLoading = false;
	let loadMoreButtonText = 'Load comments';

	const rootLevelCommentLoader = createPostCommentsPaginator(postId, null);

	const handleLoadMoreCommentsClick = async () => {
		commentsLoading = true;
		const paginationData = await rootLevelCommentLoader();
		commentsLoading = false;

		const { pageNumber, noMoreComments: noMoreCommentsResult } = paginationData;
		loadMoreButtonText = pageNumber > 0 ? 'Load more comments' : 'Load comments';
		noMoreComments = noMoreCommentsResult;
	};

	const commentTreeUnsubscribe = commentTreeStore.subscribe((currentCommentTree) => {
		topLevelComments = currentCommentTree.getReplies('root');
	});

	onDestroy(() => {
		commentTreeStore.set(new CommentTree());
		commentTreeUnsubscribe();
	});
</script>

<section class="ml-2">
	{#each topLevelComments as comment (comment.id)}
		<Comment {comment} />
	{/each}

	{#if !noMoreComments}
		<Button on:click={handleLoadMoreCommentsClick} color="blue" class="mt-2"
			>{loadMoreButtonText}</Button
		>
	{/if}
</section>
