<script lang="ts">
	import { editPost } from '$lib/client/api/posts';
	import { EDIT_POST_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal } from '$lib/client/helpers/context';
	import { MAXIMUM_POST_DESCRIPTION_LENGTH } from '$lib/shared/constants/posts';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import { onMount } from 'svelte';

	let post: TPost;
	let description: string = $state('');
	let editingPost: boolean = false;

	const activeModal = getActiveModal();

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === EDIT_POST_MODAL_NAME) {
			const { post: focusedEditPost } = data.modalData as { post: TPost };
			post = focusedEditPost;
			description = focusedEditPost.description;
		}
	});

	const handleOnEditClick = async () => {
		if (!post || !post.id || description.length === 0) return;

		const response = await editPost(post.id, { description });
		if (response.ok) {
			toast.push('Edited the post successfully', SUCCESS_TOAST_OPTIONS);
			activeModal.set({ isOpen: false, focusedModalName: null });
			post.description = description;
		} else {
			toast.push('An unexpected error occured while editing the post', FAILURE_TOAST_OPTIONS);
		}
	};

	onMount(() => {
		return () => {
			modalStoreUnsubscribe();
		};
	});
</script>

<Modal
	title="Edit this post"
	open={$activeModal.isOpen && $activeModal.focusedModalName === EDIT_POST_MODAL_NAME}
	on:close={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
	class="w-full"
>
	<Label class="mb-1" for="post-description-textarea">
		Please enter a description for your post <br /> (max {MAXIMUM_POST_DESCRIPTION_LENGTH} characters)
	</Label>
	<Textarea
		id="post-description-textarea"
		maxlength={MAXIMUM_POST_DESCRIPTION_LENGTH}
		rows="5"
		bind:value={description}
		name="description"
		placeholder="Enter a description"
		required
	/>
	<p class="leading-none dark:text-gray-400 text-right mt-2">
		{description.length}/{MAXIMUM_POST_DESCRIPTION_LENGTH}
	</p>

	<Button
		disabled={editingPost || description.length === 0}
		on:click={handleOnEditClick}
		class="w-full"
		color="green">Edit post</Button
	>
</Modal>
