<script lang="ts">
	import { createPostCommentsPaginator } from '$lib/client/api/comments';
	import { commentTreeStore } from '$lib/client/stores/comments';
	import CommentTree from '$lib/shared/helpers/comments';
	import type { IComment } from '$lib/shared/types/comments';
	import { Button } from 'flowbite-svelte';
	import { onDestroy, onMount } from 'svelte';
	import Comment from './Comment.svelte';

	export let postId: string;

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
		handleLoadMoreCommentsClick(true);
	});

	onDestroy(() => {
		commentTreeStore.set(new CommentTree());
		commentTreeUnsubscribe();
	});
</script>

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
