<script lang="ts">
	import { createComment, editComment } from '$lib/client/api/comments';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { convertToMarkdown, htmlToMarkdown } from '$lib/client/helpers/comments';
	import { getAuthenticatedUser, getCommentTree } from '$lib/client/helpers/context';
	import { COMMENT_TEXT_AREA_ROWS, MAXIMUM_CONTENT_LENGTH } from '$lib/shared/constants/comments';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { TComment } from '$lib/shared/types/comments';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import TabItem from 'flowbite-svelte/TabItem.svelte';
	import Tabs from 'flowbite-svelte/Tabs.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';
	import { onMount } from 'svelte';
	import EmojiSearch from '../reusable/EmojiSearch.svelte';

	type Props = {
		onCommentCreate?: (() => void) | null;
		onCommentEdit?: (() => void) | null;
		postId: string;
		content?: string;
		commentId?: string | null;
		parentCommentId?: string | null;
		editMode?: boolean;
	};

	let {
		onCommentCreate = null,
		onCommentEdit = null,
		postId,
		commentId = null,
		parentCommentId = null,
		content = '',
		editMode = false,
	}: Props = $props();

	let commentCreating = $state(false);
	let commentEditing = $state(false);
	let commentContent = $state(htmlToMarkdown(content));
	let commentContentMarkdown = $state('');

	const user = getAuthenticatedUser();
	const commentTree = getCommentTree();

	const handleOnInput = async (event: Event) => {
		const target = event.target as HTMLTextAreaElement;
		commentContentMarkdown = await convertToMarkdown(target.value);
	};

	const handleEmoji = async (targetEmoji: string) => {
		const emojiPadding = ` ${targetEmoji} `;
		if (commentContent.length + emojiPadding.length > MAXIMUM_CONTENT_LENGTH) return;

		commentContent += emojiPadding;
		commentContentMarkdown = await convertToMarkdown(commentContent);
	};

	const handleCommentEdit = async () => {
		if (!$user) return;
		if (!commentContent) return;
		if (commentContent.length > MAXIMUM_CONTENT_LENGTH) return;
		if (!commentId) return;

		commentEditing = true;
		const response = await editComment(postId, commentId, commentContentMarkdown);
		if (response.ok) {
			toast.push('The comment was edited successfully', SUCCESS_TOAST_OPTIONS);

			commentTree.update((commentTree) => {
				commentTree.editComment(commentId, commentContentMarkdown);
				return commentTree;
			});

			onCommentEdit && onCommentEdit();
			commentEditing = false;
		} else {
			toast.push('An error occured while editing your comment', FAILURE_TOAST_OPTIONS);
		}
	};

	const handleCommentCreate = async () => {
		if (!$user) return;
		if (!commentContent) return;
		if (commentContent.length > MAXIMUM_CONTENT_LENGTH) return;

		commentCreating = true;
		const response = await createComment(postId, {
			content: commentContentMarkdown,
			parentCommentId,
		});
		commentCreating = false;

		if (response.ok) {
			toast.push('The comment was posted successfully', SUCCESS_TOAST_OPTIONS);

			const responseData: TApiResponse<TComment> = await response.json();
			const newComment = responseData.data;

			commentTree.update((commentTree) => {
				commentTree.addComment({
					...newComment,
					createdAt: new Date(newComment.createdAt),
					updatedAt: new Date(newComment.updatedAt),
					authorId: $user?.id,
					author: $user,
				});
				return commentTree;
			});

			onCommentCreate && onCommentCreate();
			commentContent = '';
			commentContentMarkdown = '';
		} else {
			toast.push('An error occured while posting your comment', FAILURE_TOAST_OPTIONS);
		}
	};

	onMount(() => {
		if (content.length > 0) {
			convertToMarkdown(content).then((markdownResult) => {
				commentContentMarkdown = markdownResult;
			});
		}
	});
</script>

<Tabs style="underline">
	<TabItem open>
		{#snippet title()}
			<span>Your comment</span>
		{/snippet}
		<div class="flex flex-col space-y-2">
			<div class="flex">
				<EmojiSearch {handleEmoji} />
			</div>

			<Textarea
				bind:value={commentContent}
				placeholder="Leave a comment on this post... Feel free to use emojis, links and markdown!"
				rows={COMMENT_TEXT_AREA_ROWS}
				maxlength={MAXIMUM_CONTENT_LENGTH}
				on:input={handleOnInput}
			/>
			<p class="leading-none dark:text-gray-400">
				{commentContent.length} / {MAXIMUM_CONTENT_LENGTH}
			</p>
		</div>
		{#if !editMode}
			<Button
				disabled={commentCreating || commentContent.length === 0}
				color="blue"
				class="mt-5"
				on:click={handleCommentCreate}>Post comment</Button
			>
		{:else}
			<Button
				disabled={commentEditing || commentContent.length === 0}
				color="blue"
				class="mt-5"
				on:click={handleCommentEdit}>Edit comment</Button
			>
		{/if}
	</TabItem>
	<TabItem>
		{#snippet title()}
			<span>Preview your markdown comment</span>
		{/snippet}
		<div class="z-10 flex flex-col p-4 dark:bg-gray-700 dark:border-gray-600 text-left">
			{#if commentContentMarkdown.length > 0}
				<p class="flex items-center text-sm font-normal text-gray-500 dark:text-gray-400">
					{@html commentContentMarkdown}
				</p>
			{:else}
				<p class="flex items-center text-sm font-normal text-gray-500 dark:text-gray-400">
					Preview will come here
				</p>
			{/if}
		</div>
	</TabItem>
</Tabs>
