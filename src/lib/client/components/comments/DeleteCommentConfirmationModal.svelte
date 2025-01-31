<script lang="ts">
	import { deleteComment } from '$lib/client/api/comments';
	import { DELETE_COMMENT_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal, getCommentTree } from '$lib/client/helpers/context';
	import type { TComment } from '$lib/shared/types/comments';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Modal } from 'flowbite-svelte';
	import ExclamationCircleOutline from 'flowbite-svelte-icons/ExclamationCircleOutline.svelte';
	import { onMount } from 'svelte';

	let targetDeletionComment: TComment | null = $state(null);
	let commentDeletionLoading = $state(false);

	const activeModal = getActiveModal();
	const commentTree = getCommentTree();

	const handleDeleteComment = async () => {
		if (!targetDeletionComment) return;

		const response = await deleteComment(targetDeletionComment.postId, targetDeletionComment.id);
		if (response.ok) {
			toast.push('The comment was deleted successfully!', SUCCESS_TOAST_OPTIONS);
			activeModal.set({ isOpen: false, focusedModalName: null });

				
		} else {
			toast.push(
				'An unexpected error occured while trying to delete the comment!',
				FAILURE_TOAST_OPTIONS,
			);
		}
	};

	const activeModalUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === DELETE_COMMENT_MODAL_NAME) {
			const { comment: focusedDeletionComment } = data.modalData as { comment: TComment };
			targetDeletionComment = focusedDeletionComment;
		}
	});

	onMount(() => {
		return () => {
			activeModalUnsubscribe();
		};
	});
</script>

<Modal
	open={$activeModal.isOpen &&
		$activeModal.focusedModalName === DELETE_COMMENT_MODAL_NAME &&
		targetDeletionComment !== null}
	on:close={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
	class="w-full"
>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to delete this comment?
		</h3>
		<Button
			disabled={commentDeletionLoading}
			on:click={handleDeleteComment}
			color="red"
			class="me-2">Yes, I'm sure</Button
		>
		<Button
			on:click={() => activeModal.set({ isOpen: false, focusedModalName: null })}
			color="alternative">No, cancel</Button
		>
	</div>
</Modal>
