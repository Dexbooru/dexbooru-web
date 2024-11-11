<script lang="ts">
	import { createPostCommentsPaginator } from '$lib/client/api/comments';
	import { getCommentTree } from '$lib/client/helpers/context';
	import CommentTree from '$lib/shared/helpers/comments';
	import type { TComment } from '$lib/shared/types/comments';
	import { Button } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import Comment from './Comment.svelte';

	interface Props {
		postId: string;
		postCommentCount: number;
	}

	let { postId, postCommentCount = $bindable() }: Props = $props();

	let noMoreComments = $state(false);
	let topLevelComments: TComment[] = $state([]);
	let commentsLoading = false;
	let loadMoreButtonText = $state('Load comments');

	const commentTree = getCommentTree();
	const rootLevelCommentLoader = createPostCommentsPaginator(postId, null, commentTree);

	const handleLoadMoreCommentsClick = async (isInitialLoad: boolean = false) => {
		commentsLoading = true;
		const paginationData = await rootLevelCommentLoader(isInitialLoad);
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
		postCommentCount > 0 && handleLoadMoreCommentsClick(true);

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
