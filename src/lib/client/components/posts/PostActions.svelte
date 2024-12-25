<script lang="ts">
	import { likePost } from '$lib/client/api/posts';
	import {
		COLLECTIONS_MODAL_NAME,
		DELETE_POST_MODAL_NAME,
		EDIT_POST_MODAL_NAME,
		REPORT_MODAL_NAME,
	} from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal, getAuthenticatedUser } from '$lib/client/helpers/context';
	import { normalizeCount } from '$lib/client/helpers/posts';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button } from 'flowbite-svelte';
	import {
		ExclamationCircleSolid,
		HeartSolid,
		PenSolid,
		TrashBinSolid,
	} from 'flowbite-svelte-icons';

	interface Props {
		post: TPost;
		postId: string;
		likes: number;
		author: {
			id: string;
			username: string;
			profilePictureUrl: string;
		};
		likedPost?: boolean;
	}

	let {
		post,
		postId,
		likes = $bindable(),
		author,
		likedPost = false,
	}: Props = $props();

	const user = getAuthenticatedUser();
	const activeModal = getActiveModal();

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
		} else {
			toast.push(
				`There was an error while ${hasLikedPost ? 'disliking' : 'liking'}  the post!`,
				FAILURE_TOAST_OPTIONS,
			);
		}
	};
</script>

<div class="flex flex-row space-x-3">
	<Button disabled={postLikeLoading} on:click={handleLikePost} color="green" class="flex space-x-3">
		<HeartSolid color={hasLikedPost ? 'red' : 'inherit'} role="icon" style="bg-red" />
		<span>{normalizeCount(likes)} - Like post</span>
	</Button>

	{#if $user}
		<Button
			on:click={() =>
				activeModal.set({
					isOpen: true,
					focusedModalName: COLLECTIONS_MODAL_NAME,
					modalData: { post },
				})}>Add to collection</Button
		>
	{/if}

	<div class="flex justify-center gap-2">
		<Button
			on:click={() => handleModalOpen(REPORT_MODAL_NAME, { postId })}
			class="space-x-2"
			color="yellow"
		>
			<span>Report post</span>
			<ExclamationCircleSolid />
		</Button>
	</div>

	{#if $user && $user.id === author.id}
		<div class="flex justify-center gap-2">
			<Button
				color="green"
				class="space-x-2"
				on:click={() => handleModalOpen(EDIT_POST_MODAL_NAME, { post })}
			>
				<span>Edit post</span>
				<PenSolid />
			</Button>
			<Button
				class="space-x-2"
				on:click={() => handleModalOpen(DELETE_POST_MODAL_NAME, { post })}
				color="red"
			>
				<span>Delete post</span>
				<TrashBinSolid />
			</Button>
		</div>
	{/if}
</div>
