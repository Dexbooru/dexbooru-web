<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { deletePost } from '$lib/client/api/posts';
	import { DELETE_POST_MODAL_NAME } from '$lib/client/constants/layout';
	import { INDIVIDUAL_POST_PATH_REGEX } from '$lib/client/constants/posts';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getActiveModal,
		getOriginalPostsPage,
		getPostPaginationData,
		getPostsPage,
	} from '$lib/client/helpers/context';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import ExclamationCircleOutline from 'flowbite-svelte-icons/ExclamationCircleOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import { onMount } from 'svelte';

	let targetDeletionPost: TPost | null = $state(null);
	let postId: string;
	let postDeletionLoading = $state(false);

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

	const handleDeletePost = async () => {
		postDeletionLoading = true;
		const response = await deletePost(postId);
		postDeletionLoading = false;

		if (response.ok) {
			toast.push('The post was deleted successfully!', SUCCESS_TOAST_OPTIONS);
			activeModal.set({
				isOpen: false,
				focusedModalName: null,
			});

			const pagePath = page.url.pathname;
			if (INDIVIDUAL_POST_PATH_REGEX.test(pagePath)) {
				goto('/posts');
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
		} else {
			toast.push('There was an error while deleting the post!', FAILURE_TOAST_OPTIONS);
		}
	};

	onMount(() => {
		return () => {
			modalStoreUnsubscribe();
		};
	});
</script>

<Modal
	open={$activeModal.isOpen &&
		$activeModal.focusedModalName === DELETE_POST_MODAL_NAME &&
		targetDeletionPost !== null}
	onclose={() => activeModal.set({ isOpen: false, focusedModalName: null })}
	size="xs"
	outsideclose
	class="w-full"
>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to delete this post?
		</h3>
		<Button disabled={postDeletionLoading} onclick={handleDeletePost} color="red" class="me-2"
			>Yes, I'm sure</Button
		>
		<Button
			onclick={() => activeModal.set({ isOpen: false, focusedModalName: null })}
			color="alternative">No, cancel</Button
		>
	</div>
</Modal>
