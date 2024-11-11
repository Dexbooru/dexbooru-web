<script lang="ts">
	import { createPostCommentsPaginator } from '$lib/client/api/comments';
	import { MAXIMUM_COMMENT_REPLY_DEPTH_LOAD } from '$lib/client/constants/comments';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import { applyLazyLoadingOnImageClass } from '$lib/client/helpers/dom';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { formatDate, getFormalDateTitle, ymdFormat } from '$lib/shared/helpers/dates';
	import type { TComment } from '$lib/shared/types/comments';
	import { toast } from '@zerodevx/svelte-toast';
	import { Avatar, Button } from 'flowbite-svelte';
	import { MessagesSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import Comment from './Comment.svelte';
	import CommentTextbox from './CommentTextbox.svelte';

	interface Props {
		comment: TComment;
		currentDepth?: number;
	}

	let { comment, currentDepth = 1 }: Props = $props();

	let repliesLoading = false;
	let replyBoxOpen = $state(false);
	let replies: TComment[] = $state([]);
	let loadMoreButtonText = $state('Load replies');
	let pageNumber = 0;
	let noMoreComments = $state(false);

	const user = getAuthenticatedUser();
	const commentTree = getCommentTree();
	const replyCommentLoader = createPostCommentsPaginator(comment.postId, comment.id, commentTree);

	const handleLoadRepliesClick = async (isInitialLoad: boolean = false) => {
		repliesLoading = true;
		const paginationData = await replyCommentLoader(isInitialLoad);
		repliesLoading = false;

		const { pageNumber: pageNumberResult, noMoreComments: noMoreCommentsResult } = paginationData;
		loadMoreButtonText =
			pageNumberResult > 0 && !noMoreComments ? 'Load more replies' : 'Load replies';
		pageNumber = pageNumberResult;
		noMoreComments = noMoreCommentsResult;
	};

	const handleReplyButtonClick = () => {
		if (!$user) {
			toast.push('You must be signed in to reply to comments', FAILURE_TOAST_OPTIONS);
			return;
		}

		replyBoxOpen = !replyBoxOpen;
	};

	const commentTreeUnsubscribe = commentTree.subscribe((commentTree) => {
		applyLazyLoadingOnImageClass('booru-avatar-comment');
		replies = commentTree.getReplies(comment.id);
	});

	onMount(() => {
		// simulate a loading click with the initial load param set to true
		if (currentDepth <= MAXIMUM_COMMENT_REPLY_DEPTH_LOAD) {
			handleLoadRepliesClick(true);
		}

		return () => {
			commentTreeUnsubscribe();
		};
	});
</script>

<article class="p-2 mt-2 mb-2 text-base rounded-lg">
	<div class="flex justify-between items-center mb-2">
		<div class="flex items-center">
			<p
				class="inline-flex space-x-2 items-center mr-3 text-sm text-gray-900 dark:text-white font-semibold"
			>
				<Avatar
					class="booru-avatar-comment"
					src={comment.author?.profilePictureUrl ?? undefined}
					alt={comment.authorId
						? `profile picture of ${comment.author.username}`
						: 'default user account'}
				/>
				{#if comment.author}
					<a href="/profile/{comment.author.username}">{comment.author.username}</a>
				{:else}
					<span>{DELETED_ACCOUNT_HEADING}</span>
				{/if}
			</p>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				<time datetime={ymdFormat(comment.createdAt)} title={getFormalDateTitle(comment.createdAt)}
					>{formatDate(comment.createdAt)}</time
				>
				{#if comment.updatedAt.getTime() > comment.createdAt.getTime()}
					<span class="text-gray-500 dark:text-gray-400"> (edited)</span>
				{/if}
			</p>
		</div>
	</div>

	<p class="text-gray-500 dark:text-gray-400">
		{@html comment.content}
	</p>

	<div class="flex items-center mt-4 space-x-3">
		<Button class="flex space-x-2" color="green" on:click={handleReplyButtonClick}>
			<MessagesSolid />
			<span>{replyBoxOpen ? 'Hide reply' : 'Reply'}</span>
		</Button>
		{#if !noMoreComments}
			<Button on:click={() => handleLoadRepliesClick(false)} class="flex space-x-2" color="blue">
				<MessagesSolid />
				<span>{loadMoreButtonText}</span>
			</Button>
		{/if}
	</div>

	{#if replyBoxOpen}
		<div in:slide out:slide>
			<CommentTextbox
				onCommentCreate={() => (replyBoxOpen = false)}
				postId={comment.postId}
				parentCommentId={comment.id}
			/>
		</div>
	{/if}
</article>

<div class="ml-5 border-l-2">
	{#each replies as reply (reply.id)}
		<Comment currentDepth={currentDepth + 1} comment={reply} />
	{/each}
</div>
