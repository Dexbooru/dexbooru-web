<script lang="ts">
	import { IMAGE_PREVIEW_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { filesToBase64Strings } from '$lib/client/helpers/images';
	import { modalStore } from '$lib/client/stores/layout';
	import {
		MAXIMUM_IMAGES_PER_POST,
		MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB,
	} from '$lib/shared/constants/images';
	import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Fileupload, Label, P, Spinner } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	export let images: { imageBase64: string; file: File }[] = [];
	export let loadingPictures: boolean = false;

	const resetFileUploadState = (
		target: HTMLInputElement,
		startedChangingFiles: boolean = false,
	) => {
		images = [];
		loadingPictures = false;
		target.files = null;
		if (!startedChangingFiles) {
			target.value = '';
		}
	};

	const onFileChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const files = Array.from(target.files ?? []);
		resetFileUploadState(target, true);

		loadingPictures = true;

		if (!files) {
			toast.push('Unable to process the selected file(s)', FAILURE_TOAST_OPTIONS);
			resetFileUploadState(target);
			return;
		}

		if (files.length === 0) {
			toast.push('There were no image files selected!', FAILURE_TOAST_OPTIONS);
			resetFileUploadState(target);
			return;
		}

		if (files.length > MAXIMUM_IMAGES_PER_POST) {
			toast.push(
				`Cannot upload more than ${MAXIMUM_IMAGES_PER_POST} files per post`,
				FAILURE_TOAST_OPTIONS,
			);
			resetFileUploadState(target);
			return;
		}

		if (files.find((file) => file.size === 0)) {
			toast.push('At least one of the files contained empty data', FAILURE_TOAST_OPTIONS);
			resetFileUploadState(target);
			return;
		}

		if (files.find((file) => !isFileImageSmall(file))) {
			toast.push(
				`At least one of the image files exceeded the maximum upload size of ${MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB} MB`,
				FAILURE_TOAST_OPTIONS,
			);
			resetFileUploadState(target);
			return;
		}

		if (files.find((file) => !isFileImage(file))) {
			toast.push(
				'At least one of the image files was not a proper image format',
				FAILURE_TOAST_OPTIONS,
			);
			resetFileUploadState(target);
			return;
		}

		const { failedFiles, results } = await filesToBase64Strings(files);
		if (failedFiles.length > 0) {
			toast.push(failedFiles.join(', '), FAILURE_TOAST_OPTIONS);
			resetFileUploadState(target);
			return;
		}

		images = results;
		loadingPictures = false;
	};

	onMount(() => {
		const postPicturesInput = document.querySelector(
			'#postPicturesInput',
		) as HTMLInputElement | null;
		if (postPicturesInput) {
			postPicturesInput.value = '';
			postPicturesInput.files = null;
		}
	});
</script>

<Label class="space-y-2">
	<span
		>Upload up to {MAXIMUM_IMAGES_PER_POST} images, each of which should not exceed {MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB}
		MB</span
	>
	<Fileupload
		id="postPicturesInput"
		required
		name="postPictures"
		accept="image/*"
		multiple
		on:change={onFileChange}
	/>
</Label>

{#if loadingPictures}
	<Spinner class="block ml-auto mr-auto" size="10" />
{:else if images.length > 0}
	<P size="2xl" class="text-center mt-5">Images Preview</P>
	<div class="flex flex-wrap space-x-3">
		{#each images as { imageBase64, file }}
			<Button
				color="alternative"
				style="width: 200px; height: 200px; background-image: url({imageBase64}); background-repeat: no-repeat; background-size: cover; background-position: center;"
				on:click={() =>
					modalStore.set({
						isOpen: true,
						focusedModalName: IMAGE_PREVIEW_MODAL_NAME,
						modalData: { imageBase64, imageFile: file },
					})}
			/>
		{/each}
	</div>
{/if}
