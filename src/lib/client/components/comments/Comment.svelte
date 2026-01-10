<script lang="ts">
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import { DELETE_COMMENT_MODAL_NAME, EDIT_COMMENT_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
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
					onerror={onImageError}
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
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html comment.content}
	</p>

	<div class="flex space-x-2">
		{#if $user && $commentTree.getCount() < MAXIMUM_COMMENTS_PER_POST}
			<div class="flex items-center mt-4 space-x-3">
				<Button class="flex space-x-2" color="green" onclick={handleReplyButtonClick}>
					<MessagesSolid />
					<span>{replyBoxOpen ? 'Hide reply' : 'Reply'}</span>
				</Button>
			</div>
		{/if}

		{#if $user && (comment.author.id === $user.id || isModerationRole($user.role))}
			<div class="flex items-center mt-4 space-x-3">
				<Button class="flex space-x-2" color="blue" onclick={handleEditButtonClick}>
					<PenSolid />
					<span>Edit</span></Button
				>
			</div>

			<div class="flex items-center mt-4 space-x-3">
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
	<div class="ml-5 border-l-2">
		{#each replies as reply (reply.id)}
			<Comment comment={reply} />
		{/each}
	</div>
{/if}
