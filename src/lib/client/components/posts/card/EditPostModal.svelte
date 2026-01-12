<script lang="ts">
	import { editPost } from '$lib/client/api/posts';
	import DefaultPostPicture from '$lib/client/assets/default_post_picture.webp';
	import { EDIT_POST_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal, getUpdatedPost } from '$lib/client/helpers/context';
	import { MAXIMUM_IMAGES_PER_POST, ORIGINAL_IMAGE_SUFFIX } from '$lib/shared/constants/images';
	import { MAXIMUM_POST_DESCRIPTION_LENGTH } from '$lib/shared/constants/posts';
	import { URL_REGEX } from '$lib/shared/constants/urls';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { TPost } from '$lib/shared/types/posts';
	import { toast } from '@zerodevx/svelte-toast';
	import TrashBinSolid from 'flowbite-svelte-icons/TrashBinSolid.svelte';
	import UndoOutline from 'flowbite-svelte-icons/UndoOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Img from 'flowbite-svelte/Img.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Textarea from 'flowbite-svelte/Textarea.svelte';
	import { onMount } from 'svelte';
	import PostPictureUpload from '../../files/PostPictureUpload.svelte';

	const activeModal = getActiveModal();
	const updatedPostGlobal = getUpdatedPost();

	const getImageId = (imageUrl: string) => {
		const imageUrlParts = imageUrl.split('_');
		return imageUrlParts[0];
	};

	const getUniqueImageGroupCount = (imageUrls: string[]) => {
		const uniqueImageIds = new Set(imageUrls.map((url) => getImageId(url)));
		return uniqueImageIds.size;
	};

	const getImageGroupsCount = (imageUrls: string[], deletionUrls: string[]) => {
		const remainingUrls = imageUrls.filter((url) => !deletionUrls.includes(url));
		const uniqueImageIds = new Set(remainingUrls.map((url) => getImageId(url)));
		return uniqueImageIds.size; // Return the count of unique image IDs
	};

	const getRemainingImagesCount = () =>
		getImageGroupsCount(existingPostImageUrls, deletionPostImageUrls) + newPostImages.length;

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
		if (data.focusedModalName === EDIT_POST_MODAL_NAME) {
			const { post: focusedEditPost } = data.modalData as {
				post: TPost;
			};
			post = focusedEditPost;
			description = focusedEditPost.description;
			sourceLink = focusedEditPost.sourceLink;
			existingPostImageUrls = focusedEditPost.imageUrls.filter((imageUrl) =>
				imageUrl.includes(ORIGINAL_IMAGE_SUFFIX),
			);
		}
	});

	const resetEditState = () => {
		post = undefined;
		description = '';
		sourceLink = '';
		existingPostImageUrls = [];
		editingPost = false;
		newPostImages = [];
		loadingPostPictures = false;
		deletionPostImageUrls = [];
	};

	const handleOnEditClick = async () => {
		if (!post || !post.id) return;

		const response = await editPost(post.id, {
			description,
			newPostImagesContent: newPostImages.map((image) => image.imageBase64),
			deletionPostImageUrls,
			sourceLink,
		});
		if (response.ok) {
			toast.push('Edited the post successfully', SUCCESS_TOAST_OPTIONS);

			const repsonseData: TApiResponse<TPost> = await response.json();
			const updatedPost = repsonseData.data;
			updatedPost.updatedAt = new Date(updatedPost.updatedAt);
			updatedPostGlobal.set(updatedPost);

			activeModal.set({ isOpen: false, focusedModalName: null });
		} else {
			toast.push('An unexpected error occured while editing the post', FAILURE_TOAST_OPTIONS);
		}
	};

	const handleModalClose = () => {
		activeModal.set({ isOpen: false, focusedModalName: null });
		resetEditState();
	};

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;
		target.src = DefaultPostPicture;
	};

	let post: TPost | undefined = $state();
	let description: string = $state('');
	let sourceLink: string = $state('');
	let existingPostImageUrls: string[] = $state([]);
	let editingPost: boolean = $state(false);
	let newPostImages: { imageBase64: string; file: File }[] = $state([]);
	let deletionPostImageUrls: string[] = $state([]);
	let loadingPostPictures: boolean = $state(false);
	let editButtonDisabled = $derived.by(() => {
		const remainingImagesCount = getRemainingImagesCount();

		return (
			editingPost ||
			description.length === 0 ||
			!URL_REGEX.test(sourceLink) ||
			sourceLink.length === 0 ||
			remainingImagesCount === 0
		);
	});
	let maximumImagesAllowed = $derived.by(() => {
		const remainingImagesCount = getRemainingImagesCount();
		return MAXIMUM_IMAGES_PER_POST - remainingImagesCount;
	});
	let uniqueDeletedImagesCount = $derived.by(() => {
		return getUniqueImageGroupCount(deletionPostImageUrls);
	});

	onMount(() => {
		return () => {
			modalStoreUnsubscribe();
		};
	});
</script>

<Modal
	title="Edit this post"
	open={$activeModal.isOpen && $activeModal.focusedModalName === EDIT_POST_MODAL_NAME}
	onclose={handleModalClose}
	size="md"
	outsideclose
	class="w-full"
>
	<Label class="mb-1" for="post-description-textarea">
		Please enter a description for your post <br /> (max {MAXIMUM_POST_DESCRIPTION_LENGTH} characters)
	</Label>
	<Textarea
		id="post-description-textarea"
		maxlength={MAXIMUM_POST_DESCRIPTION_LENGTH}
		rows={5}
		bind:value={description}
		name="description"
		class="w-full"
		placeholder="Enter a description"
		required
	/>
	<p class="leading-none dark:text-gray-400 text-right mt-2">
		{description.length}/{MAXIMUM_POST_DESCRIPTION_LENGTH}
	</p>

	<Label class="mb-1" for="post-source-link">Please enter the source link for your post</Label>
	<Input
		id="post-source-link"
		type="url"
		bind:value={sourceLink}
		name="sourceLink"
		placeholder="Enter the source link"
		required
		class="w-full p-2 border border-gray-300 rounded-md"
	/>

	<Label class="mb-1" for="edit-post-images">Update the images in this post</Label>
	<div class="space-y-2">
		<p class="text-sm mb-5">{uniqueDeletedImagesCount} post image(s) marked for deletion</p>
		{#each existingPostImageUrls as postImageUrl, index}
			<div class="flex items-center justify-between">
				<Img
					alt="editing {index + 1} in {post?.id ?? ''}"
					src={postImageUrl}
					onerror={onImageError}
					class="h-20 w-20 rounded-md object-cover"
				/>
				<div class="flex items-center space-x-2">
					{#if !deletionPostImageUrls.includes(postImageUrl)}
						<Button
							color="red"
							size="xs"
							onclick={() => {
								if (!deletionPostImageUrls.includes(postImageUrl)) {
									const postImageId = getImageId(postImageUrl);
									const matchingPostImageIdUrls =
										post?.imageUrls.filter((imageUrl) => imageUrl.includes(postImageId)) ?? [];

									deletionPostImageUrls = [...deletionPostImageUrls, ...matchingPostImageIdUrls];
								}
							}}
						>
							<TrashBinSolid class="h-5 w-5" />
						</Button>
					{:else}
						<Button
							color="blue"
							size="xs"
							onclick={() => {
								const postImageId = getImageId(postImageUrl);
								deletionPostImageUrls = deletionPostImageUrls.filter(
									(url) => !url.includes(postImageId),
								);
							}}
						>
							<UndoOutline class="h-5 w-5" />
						</Button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<Label class="mb-1" for="add-post-images">Add more images to this post</Label>
	<PostPictureUpload
		bind:loadingPictures={loadingPostPictures}
		bind:images={newPostImages}
		{maximumImagesAllowed}
	/>

	<Button disabled={editButtonDisabled} onclick={handleOnEditClick} class="w-full" color="green"
		>Edit post</Button
	>
</Modal>
