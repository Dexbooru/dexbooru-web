<script lang="ts">
	import { createComment } from '$lib/client/api/comments';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { convertToMarkdown } from '$lib/client/helpers/comments';
	import { commentTreeStore } from '$lib/client/stores/comments';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import { COMMENT_TEXT_AREA_ROWS, MAXIMUM_CONTENT_LENGTH } from '$lib/shared/constants/comments';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { IComment } from '$lib/shared/types/comments';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, TabItem, Tabs, Textarea } from 'flowbite-svelte';
	import EmojiSearch from '../reusable/EmojiSearch.svelte';

	export let onCommentCreate: (() => void) | null = null;
	export let postId: string;
	export let parentCommentId: string | null = null;

	let commentCreating = false;
	let commentContent = '';
	let commentContentMarkdown = '';

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

	const handleCommentCreate = async () => {
		if (!$authenticatedUserStore) return;
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

			const responseData: TApiResponse<IComment> = await response.json();
			const newComment = responseData.data;

			commentTreeStore.update((commentTree) => {
				commentTree.addComment({
					...newComment,
					createdAt: new Date(newComment.createdAt),
					authorId: $authenticatedUserStore?.id,
					author: $authenticatedUserStore,
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
</script>

<Tabs style="underline">
	<TabItem open>
		<span slot="title">Your comment</span>
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
		<Button
			disabled={commentCreating || commentContent.length === 0}
			color="blue"
			class="mt-5"
			on:click={handleCommentCreate}>Post comment</Button
		>
	</TabItem>
	<TabItem>
		<span slot="title">Preview your markdown comment</span>
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
