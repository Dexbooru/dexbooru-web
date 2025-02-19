<script lang="ts">
	import { IMAGE_PREVIEW_MODAL_NAME } from '$lib/client/constants/layout';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal } from '$lib/client/helpers/context';
	import { filesToBase64Strings } from '$lib/client/helpers/images';
	import {
		FILE_IMAGE_ACCEPT,
		MAXIMUM_IMAGES_PER_POST,
		MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB,
	} from '$lib/shared/constants/images';
	import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Fileupload from 'flowbite-svelte/Fileupload.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import P from 'flowbite-svelte/P.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import { onMount } from 'svelte';

	type Props = {
		maximumImagesAllowed?: number;
		images?: { imageBase64: string; file: File }[];
		loadingPictures?: boolean;
	};

	let {
		images = $bindable([]),
		loadingPictures = $bindable(false),
		maximumImagesAllowed = MAXIMUM_IMAGES_PER_POST,
	}: Props = $props();

	const activeModal = getActiveModal();

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

		if (files.length > maximumImagesAllowed) {
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

		if (files.find((file) => !isFileImageSmall(file, 'post'))) {
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

<Label class="space-y-2 ">
	<span
		>Upload up to {maximumImagesAllowed} images, each of which should not exceed {MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB}
		MB:</span
	>
	<Fileupload
		id="postPicturesInput"
		required
		name="postPictures"
		accept={FILE_IMAGE_ACCEPT}
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
				class="w-[200px] h-[200px] bg-no-repeat bg-cover bg-center"
				style="background-image: url({imageBase64});"
				on:click={() =>
					activeModal.set({
						isOpen: true,
						focusedModalName: IMAGE_PREVIEW_MODAL_NAME,
						modalData: { imageBase64, imageFile: file },
					})}
			/>
		{/each}
	</div>
{/if}
