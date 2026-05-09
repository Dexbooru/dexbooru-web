<script lang="ts">
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import { DELETE_COMMENT_MODAL_NAME, EDIT_COMMENT_MODAL_NAME } from '$lib/client/constants/layout';
	import { getCommentPermalinkUrl } from '$lib/client/constants/comments';
	import {
		FAILURE_TOAST_OPTIONS,
		SUCCESS_TOAST_OPTIONS,
		TOAST_DEFAULT_OPTIONS,
	} from '$lib/client/constants/toasts';
	import {
		getActiveModal,
		getAuthenticatedUser,
		getCommentTree,
	} from '$lib/client/helpers/context';
	import { DELETED_ACCOUNT_HEADING } from '$lib/shared/constants/auth';
	import { MAXIMUM_COMMENTS_PER_POST } from '$lib/shared/constants/posts';
	import { isModerationRole } from '$lib/shared/helpers/auth/role';
	import { formatDate, getFormalDateTitle, ymdFormat } from '$lib/shared/helpers/dates';
	import type { TComment } from '$lib/shared/types/comments';
	import { toast } from '@zerodevx/svelte-toast';
	import ClipboardOutline from 'flowbite-svelte-icons/ClipboardOutline.svelte';
	import MessagesSolid from 'flowbite-svelte-icons/MessagesSolid.svelte';
	import PenSolid from 'flowbite-svelte-icons/PenSolid.svelte';
	import TrashBinSolid from 'flowbite-svelte-icons/TrashBinSolid.svelte';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import Comment from './Comment.svelte';
	import CommentTextbox from './CommentTextbox.svelte';

	type Props = {
		comment: TComment;
		showReplies?: boolean;
	};

	let { comment, showReplies = true }: Props = $props();

	let replyBoxOpen = $state(false);
	let replies: TComment[] = $state([]);
	let commentAnchorId = $derived(`comment-${comment.id}`);

	const user = getAuthenticatedUser();
	const commentTree = getCommentTree();
	const activeModal = getActiveModal();

	const handleReplyButtonClick = () => {
		if (!$user) {
			toast.push('You must be signed in to reply to comments', FAILURE_TOAST_OPTIONS);
			return;
		}

		replyBoxOpen = !replyBoxOpen;
	};

	const handleDeleteButtonClick = () => {
		if (!$user) {
			toast.push('You must be signed in to delete comments', FAILURE_TOAST_OPTIONS);
			return;
		}

		activeModal.set({
			focusedModalName: DELETE_COMMENT_MODAL_NAME,
			modalData: { comment },
			isOpen: true,
		});
	};

	const handleEditButtonClick = () => {
		if (!$user) {
			toast.push('You must be signed in to edit comments', FAILURE_TOAST_OPTIONS);
			return;
		}

		activeModal.set({
			focusedModalName: EDIT_COMMENT_MODAL_NAME,
			modalData: { comment },
			isOpen: true,
		});
	};

	const commentTreeUnsubscribe = commentTree.subscribe((commentTree) => {
		replies = commentTree.getReplies(comment.id);
	});

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;

		target.src = DefaultProfilePicture;
	};

	const handleCopyCommentPermalink = async () => {
		const url = getCommentPermalinkUrl(comment.postId, comment.id);
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			toast.push('Comment link copied', {
				...TOAST_DEFAULT_OPTIONS,
				...SUCCESS_TOAST_OPTIONS,
			});
		} catch {
			toast.push('Could not copy link', FAILURE_TOAST_OPTIONS);
		}
	};

	onMount(() => {
		return () => {
			commentTreeUnsubscribe();
		};
	});
</script>

<article
	id={commentAnchorId}
	tabindex="-1"
	class="comment-anchor-card mt-2 mb-2 rounded-lg p-2 text-base transition-[background-color,box-shadow] duration-200 outline-none"
>
	<div class="mb-2 flex items-center justify-between">
		<div class="flex flex-wrap items-center">
			<p
				class="mr-3 inline-flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white"
			>
				<Avatar
					src={comment.author?.profilePictureUrl ?? undefined}
					alt={comment.authorId
						? `profile picture of ${comment.author.username}`
						: 'default user account'}
					onerror={onImageError}
				/>
				{#if comment.author}
					<a href="/profile/{comment.author.username}">{comment.author.username}</a>
				{:else}
					<span>{DELETED_ACCOUNT_HEADING}</span>
				{/if}
			</p>
			<p class="flex flex-wrap items-center gap-x-2 text-sm text-gray-600 dark:text-gray-400">
				<time datetime={ymdFormat(comment.createdAt)} title={getFormalDateTitle(comment.createdAt)}
					>{formatDate(comment.createdAt)}</time
				>
				<button
					type="button"
					class="inline-flex rounded p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
					aria-label="Copy link to this comment"
					title="Copy link to this comment"
					onclick={handleCopyCommentPermalink}
				>
					<ClipboardOutline class="h-4 w-4 shrink-0" />
				</button>
				{#if comment.updatedAt.getTime() > comment.createdAt.getTime()}
					<span class="text-gray-500 dark:text-gray-400"> (edited)</span>
				{/if}
			</p>
		</div>
	</div>

	<p class="text-gray-500 dark:text-gray-400">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html comment.content}
	</p>

	<div class="flex space-x-2">
		{#if $user && $commentTree.getCount() < MAXIMUM_COMMENTS_PER_POST}
			<div class="mt-4 flex items-center space-x-3">
				<Button class="flex space-x-2" color="green" onclick={handleReplyButtonClick}>
					<MessagesSolid />
					<span>{replyBoxOpen ? 'Hide reply' : 'Reply'}</span>
				</Button>
			</div>
		{/if}

		{#if $user && (comment.author.id === $user.id || isModerationRole($user.role))}
			<div class="mt-4 flex items-center space-x-3">
				<Button class="flex space-x-2" color="blue" onclick={handleEditButtonClick}>
					<PenSolid />
					<span>Edit</span></Button
				>
			</div>

			<div class="mt-4 flex items-center space-x-3">
				<Button class="flex space-x-2" color="red" onclick={handleDeleteButtonClick}>
					<TrashBinSolid />
					<span>Delete</span></Button
				>
			</div>
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

{#if showReplies}
	<div class="ml-2 border-l-2 sm:ml-5 dark:border-gray-400">
		{#each replies as reply (reply.id)}
			<Comment comment={reply} />
		{/each}
	</div>
{/if}

<style>
	@keyframes comment-target-flash-light {
		0% {
			background-color: color-mix(in srgb, rgb(59 130 246) 28%, transparent);
			box-shadow: 0 0 0 2px color-mix(in srgb, rgb(59 130 246) 35%, transparent);
		}
		35% {
			background-color: color-mix(in srgb, rgb(59 130 246) 14%, transparent);
			box-shadow: 0 0 0 1px color-mix(in srgb, rgb(59 130 246) 22%, transparent);
		}
		100% {
			background-color: transparent;
			box-shadow: none;
		}
	}

	@keyframes comment-target-flash-dark {
		0% {
			background-color: color-mix(in srgb, rgb(96 165 250) 22%, transparent);
			box-shadow: 0 0 0 2px color-mix(in srgb, rgb(147 197 253) 28%, transparent);
		}
		35% {
			background-color: color-mix(in srgb, rgb(59 130 246) 12%, transparent);
			box-shadow: 0 0 0 1px color-mix(in srgb, rgb(96 165 250) 18%, transparent);
		}
		100% {
			background-color: transparent;
			box-shadow: none;
		}
	}

	.comment-anchor-card:target {
		animation: comment-target-flash-light 1.15s ease-out forwards;
	}

	:global(html.dark) .comment-anchor-card:target {
		animation: comment-target-flash-dark 1.15s ease-out forwards;
	}

	/* Same motion as :target; JS adds this class after deep-link scroll (see CommentsContainer). */
	:global(article.comment-anchor-card.comment-permalink-flash) {
		animation: comment-target-flash-light 1.15s ease-out forwards;
	}

	:global(html.dark article.comment-anchor-card.comment-permalink-flash) {
		animation: comment-target-flash-dark 1.15s ease-out forwards;
	}
</style>
