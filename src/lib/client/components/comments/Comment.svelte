<script lang="ts">
	import { createPostCommentsPaginator } from '$lib/client/api/comments';
	import { MAXIMUM_COMMENT_REPLY_DEPTH_LOAD } from '$lib/client/constants/comments';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { formatDate, getFormalDateTitle, ymdFormat } from '$lib/shared/helpers/dates';
	import type { IComment } from '$lib/shared/types/comments';
	import { toast } from '@zerodevx/svelte-toast';
	import { Avatar, Button } from 'flowbite-svelte';
	import { MessagesSolid } from 'flowbite-svelte-icons';
	import { onDestroy, onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import CommentTextbox from './CommentTextbox.svelte';

	export let comment: IComment;
	export let currentDepth: number = 1;

	let repliesLoading = false;
	let replyBoxOpen = false;
	let replies: IComment[] = [];
	let loadMoreButtonText = 'Load replies';
	let pageNumber = 0;
	let noMoreComments = false;

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
		replies = commentTree.getReplies(comment.id);
	});

	onMount(() => {
		// simulate a loading click with the initial load param set to true
		if (currentDepth <= MAXIMUM_COMMENT_REPLY_DEPTH_LOAD) {
			handleLoadRepliesClick(true);
		}
	});

	onDestroy(() => {
		commentTreeUnsubscribe();
	});
</script>

<article class="p-6 mt-2 mb-2 text-base bg-gray-100 rounded-lg dark:bg-gray-900">
	<div class="flex justify-between items-center mb-2">
		<div class="flex items-center">
			<p
				class="inline-flex space-x-2 items-center mr-3 text-sm text-gray-900 dark:text-white font-semibold"
			>
				<Avatar
					class="booru-avatar"
					src={comment.author?.profilePictureUrl ?? undefined}
					alt={comment.authorId
						? `profile picture of ${comment.author.username}`
						: 'default user account'}
				/>
				{#if comment.author}
					<a href="/profile/{comment.author.username}">{comment.author.username}</a>
				{:else}
					<h2>{DELETED_ACCOUNT_HEADING}</h2>
				{/if}
			</p>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				<time datetime={ymdFormat(comment.createdAt)} title={getFormalDateTitle(comment.createdAt)}
					>{formatDate(comment.createdAt)}</time
				>
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

<div class="ml-2 border-l-2">
	{#each replies as reply (reply.id)}
		<svelte:self currentDepth={currentDepth + 1} comment={reply} />
	{/each}
</div>
