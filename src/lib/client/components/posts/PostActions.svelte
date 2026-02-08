<script lang="ts">
	import { likePost } from '$lib/client/api/posts';
	import {
		COLLECTIONS_MODAL_NAME,
		DELETE_POST_MODAL_NAME,
		EDIT_POST_MODAL_NAME,
		REPORT_MODAL_NAME,
		REPORT_POST_LIST_MODAL_NAME,
	} from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getActiveModal,
		getAuthenticatedUser,
		getUpdatedPost,
	} from '$lib/client/helpers/context';
	import { normalizeCount } from '$lib/client/helpers/posts';
	import { isModerationRole } from '$lib/shared/helpers/auth/role';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
	import HeartSolid from 'flowbite-svelte-icons/HeartSolid.svelte';
	import PenSolid from 'flowbite-svelte-icons/PenSolid.svelte';
	import TrashBinSolid from 'flowbite-svelte-icons/TrashBinSolid.svelte';
	import Button from 'flowbite-svelte/Button.svelte';

	type Props = {
		post: TPost;
		postId: string;
		likes: number;
		author: {
			id: string;
			username: string;
			profilePictureUrl: string;
		};
		likedPost?: boolean;
	};

	let { post, postId, likes = $bindable(), author, likedPost = false }: Props = $props();

	const user = getAuthenticatedUser();
	const activeModal = getActiveModal();
	const updatedPost = getUpdatedPost();

	let postLikeLoading = $state(false);
	let hasLikedPost = $state(likedPost);

	const handleModalOpen = (focusedModalName: string, data: unknown) => {
		activeModal.set({
			isOpen: true,
			focusedModalName: focusedModalName,
			modalData: data,
		});
	};

	const handleLikePost = async () => {
		if (!$user) {
			toast.push(
				'Please sign-in or register for an account to able to like posts',
				FAILURE_TOAST_OPTIONS,
			);
			return;
		}
		postLikeLoading = true;
		const response = await likePost(postId, { action: hasLikedPost ? 'dislike' : 'like' });
		postLikeLoading = false;

		if (response.ok) {
			toast.push(
				`${hasLikedPost ? 'Disliked' : 'Liked'} the post successfully!`,
				SUCCESS_TOAST_OPTIONS,
			);

			likes = hasLikedPost ? likes - 1 : likes + 1;
			hasLikedPost = !hasLikedPost;

			updatedPost.update((post) => {
				post.likes = likes;
				return post;
			});
		} else {
			toast.push(
				`There was an error while ${hasLikedPost ? 'disliking' : 'liking'}  the post!`,
				FAILURE_TOAST_OPTIONS,
			);
		}
	};
</script>

<div class="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
	<Button
		disabled={postLikeLoading}
		onclick={handleLikePost}
		color="green"
		class="flex w-full items-center justify-center space-x-3 sm:w-auto"
	>
		<HeartSolid color={hasLikedPost ? 'red' : 'inherit'} role="icon" style="bg-red" />
		<span>
			{normalizeCount(likes)}
			{#if $user}
				- Like post
			{/if}
		</span>
	</Button>

	{#if $user}
		<Button
			onclick={() =>
				activeModal.set({
					isOpen: true,
					focusedModalName: COLLECTIONS_MODAL_NAME,
					modalData: { post },
				})}
			class="w-full sm:w-auto"
		>
			Add/remove from collections
		</Button>
	{/if}

	<div class="flex flex-col justify-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
		<Button href="/collections/post/{postId}" class="w-full space-x-2 sm:w-auto" color="blue">
			<span>View collections</span>
		</Button>
	</div>

	<div class="flex flex-col justify-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
		<Button
			onclick={() => handleModalOpen(REPORT_MODAL_NAME, { post })}
			class="w-full space-x-2 sm:w-auto"
			color="yellow"
		>
			<span>Report post</span>
			<ExclamationCircleSolid />
		</Button>
	</div>

	{#if $user && isModerationRole($user.role)}
		<div class="flex flex-col justify-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
			<Button
				onclick={() => handleModalOpen(REPORT_POST_LIST_MODAL_NAME, { post })}
				class="w-full space-x-2 sm:w-auto"
				color="red"
			>
				<span>Show reports</span>
			</Button>
		</div>
	{/if}

	{#if $user && ($user.id === author.id || $user.role === 'OWNER')}
		<div class="flex flex-col justify-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
			<Button
				color="green"
				class="w-full space-x-2 sm:w-auto"
				onclick={() =>
					handleModalOpen(EDIT_POST_MODAL_NAME, {
						post,
						handleUpdatePost: (updatedPost: TPost) => {
							post = updatedPost;
						},
					})}
			>
				<span>Edit post</span>
				<PenSolid />
			</Button>
			<Button
				class="w-full space-x-2 sm:w-auto"
				onclick={() => handleModalOpen(DELETE_POST_MODAL_NAME, { post })}
				color="red"
			>
				<span>Delete post</span>
				<TrashBinSolid />
			</Button>
		</div>
	{/if}
</div>
