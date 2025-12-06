<script lang="ts">
	import { EDIT_COMMENT_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal } from '$lib/client/helpers/context';
	import type { TComment } from '$lib/shared/types/comments';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import { onMount } from 'svelte';
	import CommentTextbox from './CommentTextbox.svelte';

	let targetEditComment: TComment | null = $state(null);

	const activeModal = getActiveModal();

	const activeModalUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === EDIT_COMMENT_MODAL_NAME) {
			const { comment: focusedEditComment } = data.modalData as { comment: TComment };
			targetEditComment = focusedEditComment;
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
		$activeModal.focusedModalName === EDIT_COMMENT_MODAL_NAME &&
		targetEditComment !== null}
	onclose={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	size="lg"
	outsideclose
	class="w-full"
>
	<CommentTextbox
		onCommentEdit={() => {
			activeModal.set({ isOpen: false, focusedModalName: null });
		}}
		commentId={targetEditComment?.id ?? ''}
		postId={targetEditComment?.postId ?? ''}
		content={targetEditComment?.content ?? ''}
		editMode
	/>
</Modal>
