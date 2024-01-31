<script lang="ts">
	import { page } from '$app/stores';
	import { deletePost, likePost } from '$lib/client/api/posts';
	import { REPORT_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { normalizeCount } from '$lib/client/helpers/posts';
	import { modalStore } from '$lib/client/stores/layout';
	import {
		originalPostsPageStore,
		postPaginationStore,
		postsPageStore
	} from '$lib/client/stores/posts';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import type { IPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button } from 'flowbite-svelte';
	import {
		ArrowRightToBracketSolid,
		ExclamationCircleSolid,
		HeartSolid,
		TrashBinSolid
	} from 'flowbite-svelte-icons';
	import PostCardReportModal from './PostCardReportModal.svelte';

	export let post: IPost;
	export let postId: string;
	export let likes: number;
	export let author: {
		id: string;
		username: string;
		profilePictureUrl: string;
	};

	let postLikeLoading = false;
	let postDeletionLoading = false;
	let hasLikedPost = $postPaginationStore?.likedPosts.map((post) => post.id).includes(postId);

	const pagePathName = $page.url.pathname;
	const isPostAuthor = $authenticatedUserStore && $authenticatedUserStore.id === author.id;

	const handleModalOpen = () => {
		modalStore.set({
			isOpen: true,
			focusedModalName: REPORT_MODAL_NAME
		});
	};

	const handleLikePost = async () => {
		if (!$authenticatedUserStore) {
			toast.push(
				'Please sign-in or register for an account to able to like posts',
				FAILURE_TOAST_OPTIONS
			);
			return;
		}
		postLikeLoading = true;
		const response = await likePost({ postId, action: hasLikedPost ? 'dislike' : 'like' });
		postLikeLoading = false;

		if (response.ok) {
			toast.push(
				`${hasLikedPost ? 'Disliked' : 'Liked'} the post successfully!`,
				SUCCESS_TOAST_OPTIONS
			);
			likes = hasLikedPost ? likes - 1 : likes + 1;
			postPaginationStore.update((paginationData) => {
				if (!paginationData) return null;

				if (hasLikedPost) {
					paginationData.likedPosts = paginationData?.likedPosts.filter(
						(likedPost) => likedPost.id !== postId
					);
				} else {
					paginationData.likedPosts.push(post);
				}

				return paginationData;
			});

			if (
				(pagePathName === '/profile/posts/liked' || pagePathName === '/profile/posts/liked/') &&
				hasLikedPost
			) {
				postsPageStore.update((previousPosts) =>
					previousPosts.filter((post) => post.id !== postId)
				);
				originalPostsPageStore.update((previousPosts) => {
					return previousPosts.filter((post) => post.id !== postId);
				});
			}

			hasLikedPost = !hasLikedPost;
		} else {
			toast.push(
				`There was an error while ${hasLikedPost ? 'disliking' : 'liking'}  the post!`,
				FAILURE_TOAST_OPTIONS
			);
		}
	};

	const handleDeletePost = async () => {
		postDeletionLoading = true;
		const response = await deletePost({ postId, authorId: author.id });
		postDeletionLoading = false;

		if (response.ok) {
			postsPageStore.update((previousPosts) => previousPosts.filter((post) => post.id !== postId));
			originalPostsPageStore.update((previousPosts) =>
				previousPosts.filter((post) => post.id !== postId)
			);
			postPaginationStore.update((paginationData) => {
				if (!paginationData) return null;

				return {
					...paginationData,
					posts: paginationData.posts.filter((post) => post.id !== postId)
				};
			});
			toast.push('The post was deleted successfully!', SUCCESS_TOAST_OPTIONS);
		} else {
			toast.push('There was an error while deleting the post!', FAILURE_TOAST_OPTIONS);
		}
	};
</script>

<div class="flex flex-col space-y-3">
	<Button disabled={postLikeLoading} on:click={handleLikePost} color="green" class="flex space-x-3">
		<HeartSolid color={hasLikedPost ? 'red' : 'inherit'} role="icon" style="bg-red" />
		<span>{normalizeCount(likes)} - Like post</span>
	</Button>

	<Button class="space-x-2" href="/posts/{postId}" color="blue">
		<span>View full post</span>
		<ArrowRightToBracketSolid />
	</Button>
	<Button on:click={handleModalOpen} class="space-x-2" color="yellow">
		<span>Report post</span>
		<ExclamationCircleSolid />
	</Button>
	{#if isPostAuthor}
		<Button
			class="space-x-2"
			disabled={postDeletionLoading}
			on:click={handleDeletePost}
			color="red"
		>
			<span>Delete post</span>
			<TrashBinSolid />
		</Button>
	{/if}
</div>

<PostCardReportModal {postId} />
