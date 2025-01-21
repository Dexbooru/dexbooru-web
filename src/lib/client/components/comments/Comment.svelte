<script lang="ts">
	import { createPostCommentsPaginator } from '$lib/client/api/comments';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { formatDate, getFormalDateTitle, ymdFormat } from '$lib/shared/helpers/dates';
	import type { TComment } from '$lib/shared/types/comments';
	import { toast } from '@zerodevx/svelte-toast';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import MessagesSolid from 'flowbite-svelte-icons/MessagesSolid.svelte';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import Comment from './Comment.svelte';
	import CommentTextbox from './CommentTextbox.svelte';

	type Props = {
		comment: TComment;
		currentDepth?: number;
	};

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

	const handleLoadRepliesClick = async () => {
		repliesLoading = true;
		const paginationData = await replyCommentLoader();
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
		{#if !noMoreComments && comment.replyCount > 0}
			<Button on:click={() => handleLoadRepliesClick()} class="flex space-x-2" color="blue">
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
