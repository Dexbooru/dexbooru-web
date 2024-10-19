<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { deletePost } from '$lib/client/api/posts';
	import { DELETE_POST_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getActiveModal,
		getOriginalPostsPage,
		getPostPaginationData,
		getPostsPage,
	} from '$lib/client/helpers/context';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Modal } from 'flowbite-svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import { onDestroy } from 'svelte';

	let targetDeletionPost: TPost | null = null;
	let postId: string;
	let postDeletionLoading = false;

	const postsPage = getPostsPage();
	const originalPostPage = getOriginalPostsPage();
	const postPagination = getPostPaginationData();
	const activeModal = getActiveModal();

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === DELETE_POST_MODAL_NAME) {
			const { post: focusedDeletionPost } = data.modalData as { post: TPost };
			targetDeletionPost = focusedDeletionPost;
			postId = targetDeletionPost.id;
		}
	});

	const individualPostPathRegex = new RegExp(
		'^/posts/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
	);

	const pagePath = $page.url.pathname;

	const handleDeletePost = async () => {
		postDeletionLoading = true;
		const response = await deletePost(postId);
		postDeletionLoading = false;

		if (response.ok) {
			if (individualPostPathRegex.test(pagePath)) {
				goto('/');
				return;
			}
			postsPage.update((previousPosts) => previousPosts.filter((post) => post.id !== postId));
			originalPostPage.update((previousPosts) =>
				previousPosts.filter((post) => post.id !== postId),
			);
			postPagination.update((paginationData) => {
				if (!paginationData) return null;

				return {
					...paginationData,
					posts: paginationData.posts.filter((post) => post.id !== postId),
				};
			});
			toast.push('The post was deleted successfully!', SUCCESS_TOAST_OPTIONS);
			activeModal.set({
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
	open={$activeModal.isOpen &&
		$activeModal.focusedModalName === DELETE_POST_MODAL_NAME &&
		targetDeletionPost !== null}
	on:close={() => activeModal.set({ isOpen: false, focusedModalName: null })}
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
			on:click={() => activeModal.set({ isOpen: false, focusedModalName: null })}
			color="alternative">No, cancel</Button
		>
	</div>
</Modal>
