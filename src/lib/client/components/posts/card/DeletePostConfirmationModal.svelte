<script lang="ts">
	import { deletePost } from '$lib/client/api/posts';
	import { DELETE_POST_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { modalStore } from '$lib/client/stores/layout';
	import {
		originalPostsPageStore,
		postPaginationStore,
		postsPageStore,
	} from '$lib/client/stores/posts';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Modal } from 'flowbite-svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import { onDestroy } from 'svelte';

	let targetDeletionPost: TPost | null = null;
	let postId: string;
	let postDeletionLoading = false;

	const modalStoreUnsubscribe = modalStore.subscribe((data) => {
		if (data.focusedModalName === DELETE_POST_MODAL_NAME) {
			const { post: focusedDeletionPost } = data.modalData as { post: TPost };
			targetDeletionPost = focusedDeletionPost;
			postId = targetDeletionPost.id;
		}
	});

	const handleDeletePost = async () => {
		postDeletionLoading = true;
		const response = await deletePost(postId);
		postDeletionLoading = false;

		if (response.ok) {
			postsPageStore.update((previousPosts) => previousPosts.filter((post) => post.id !== postId));
			originalPostsPageStore.update((previousPosts) =>
				previousPosts.filter((post) => post.id !== postId),
			);
			postPaginationStore.update((paginationData) => {
				if (!paginationData) return null;

				return {
					...paginationData,
					posts: paginationData.posts.filter((post) => post.id !== postId),
				};
			});
			toast.push('The post was deleted successfully!', SUCCESS_TOAST_OPTIONS);
			modalStore.set({
				isOpen: false,
				focusedModalName: null,
			});
		} else {
			toast.push('There was an error while deleting the post!', FAILURE_TOAST_OPTIONS);
		}
	};

	onDestroy(() => {
		modalStoreUnsubscribe();
	});
</script>

<Modal
	open={$modalStore.isOpen &&
		$modalStore.focusedModalName === DELETE_POST_MODAL_NAME &&
		targetDeletionPost !== null}
	on:close={() => modalStore.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
	class="w-full"
>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to delete this post?
		</h3>
		<Button disabled={postDeletionLoading} on:click={handleDeletePost} color="red" class="me-2"
			>Yes, I'm sure</Button
		>
		<Button
			on:click={() => modalStore.set({ isOpen: false, focusedModalName: null })}
			color="alternative">No, cancel</Button
		>
	</div>
</Modal>
