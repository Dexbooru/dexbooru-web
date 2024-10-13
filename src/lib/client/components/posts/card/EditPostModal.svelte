<script lang="ts">
	import { editPost } from '$lib/client/api/posts';
	import { EDIT_POST_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { modalStore } from '$lib/client/stores/layout';
	import { MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION } from '$lib/shared/constants/images';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Label, Modal, Textarea } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';

	let post: TPost;
	let description: string = '';
	let editingPost: boolean = false;

	const modalStoreUnsubscribe = modalStore.subscribe((data) => {
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
			modalStore.set({ isOpen: false, focusedModalName: null });
			post.description = description;
		} else {
			toast.push('An unexpected error occured while editing the post', FAILURE_TOAST_OPTIONS);
		}
	};

	onDestroy(() => {
		modalStoreUnsubscribe();
	});
</script>

<Modal
	title="Edit this post"
	open={$modalStore.isOpen && $modalStore.focusedModalName === EDIT_POST_MODAL_NAME}
	on:close={() => modalStore.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
	class="w-full"
>
	<Label class="mb-1" for="description-textarea">
		Please enter a description for your post <br /> (max {MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION} characters)
	</Label>
	<Textarea
		id="description-textarea"
		maxlength={MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION}
		rows="5"
		bind:value={description}
		name="description"
		placeholder="Enter a description"
		required
	/>
	<p class="leading-none dark:text-gray-400 text-right mt-2">
		{description.length}/{MAXIMUM_CHARACTERS_PER_POST_DESCRIPTION}
	</p>

	<Button
		disabled={editingPost || description.length === 0}
		on:click={handleOnEditClick}
		class="w-full"
		color="green">Edit post</Button
	>
</Modal>
