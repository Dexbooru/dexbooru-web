<script lang="ts">
	import { run } from 'svelte/legacy';

	import { enhance } from '$app/forms';
	import {
		MAXIMUM_COLLECTION_DESCRIPTION_LENGTH,
		MAXIMUM_COLLECTION_TITLE_LENGTH,
	} from '$lib/shared/constants/collections';
	import {
		COLLECTION_THUMBNAIL_HEIGHT,
		COLLECTION_THUMBNAIL_WIDTH,
		FILE_IMAGE_ACCEPT,
		MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB,
	} from '$lib/shared/constants/images';
	import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
	import { isLabelAppropriate } from '$lib/shared/helpers/labels';
	import { toast } from '@zerodevx/svelte-toast';
	import {
		Button,
		Checkbox,
		Fileupload,
		ImagePlaceholder,
		Input,
		Label,
		Textarea,
	} from 'flowbite-svelte';
	import { CalendarEditSolid } from 'flowbite-svelte-icons';
	import { FAILURE_TOAST_OPTIONS } from '../constants/toasts';
	import { filesToBase64Strings } from '../helpers/images';

	let title: string = $state('');
	let description: string = $state('');
	let thumbnailFile: File | null = $state(null);
	let thumbnailBase64: string = $state('');
	let thumbnailLoading: boolean = $state(false);
	let createCollectionButtonDisabled = $state(true);
	let isNsfw: boolean = $state(false);

	const resetFileUploadState = () => {
		thumbnailLoading = false;
		thumbnailBase64 = '';
		thumbnailFile = null;
	};

	const onFileChange = async (event: Event) => {
		thumbnailLoading = true;

		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (!files || files.item(0) === null) {
			toast.push(
				'An unexpected error occured while uploading the collection thumbnail',
				FAILURE_TOAST_OPTIONS,
			);
			resetFileUploadState();
			return;
		}

		const file = files.item(0) as File;
		if (!isFileImageSmall(file, 'collection')) {
			toast.push(
				`The collection thumbnail image has a maximum size of ${MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB} MB`,
				FAILURE_TOAST_OPTIONS,
			);
			resetFileUploadState();
			return;
		}

		if (!isFileImage(file)) {
			toast.push('The collection thumbnail must be in an image format', FAILURE_TOAST_OPTIONS);
			resetFileUploadState();
			return;
		}

		const { failedFiles, results } = await filesToBase64Strings([file]);
		if (failedFiles.length > 0) {
			toast.push(
				'An unexpected error while parsing the provided collection thumbnail image',
				FAILURE_TOAST_OPTIONS,
			);
			resetFileUploadState();
			return;
		}

		thumbnailLoading = false;
		thumbnailBase64 = results[0].imageBase64;
		thumbnailFile = results[0].file;
	};

	run(() => {
		createCollectionButtonDisabled = !(
			isLabelAppropriate(title, 'collectionTitle') &&
			isLabelAppropriate(description, 'collectionDescription') &&
			(thumbnailFile === null ||
				(thumbnailFile !== null &&
					isFileImage(thumbnailFile) &&
					isFileImageSmall(thumbnailFile, 'collection')))
		);
	});
</script>

<form use:enhance method="POST" enctype="multipart/form-data" class="mb-6">
	<div class="mb-6">
		<Label for="title" class="block mb-2"
			>Title (max of {MAXIMUM_COLLECTION_TITLE_LENGTH} characters):</Label
		>
		<Input
			name="title"
			bind:value={title}
			maxlength={MAXIMUM_COLLECTION_TITLE_LENGTH}
			required
			placeholder="Enter a title"
		/>
	</div>
	<div class="mb-6">
		<Label for="description" class="mb-2"
			>Description (max of {MAXIMUM_COLLECTION_DESCRIPTION_LENGTH} characters):</Label
		>
		<Textarea
			placeholder="Enter a description"
			maxlength={MAXIMUM_COLLECTION_DESCRIPTION_LENGTH}
			rows="4"
			name="description"
			bind:value={description}
		/>
	</div>

	<div class="mb-6">
		<Checkbox bind:checked={isNsfw}>Is NSFW?</Checkbox>
		<Input type="hidden" value={isNsfw} name="isNsfw" />
	</div>

	<div class="mb-6">
		<Label for="collectionThumbnail" class="mb-2"
			>Collection Thumbnnail (maximum image size is {MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB} MB)</Label
		>
		<Fileupload on:change={onFileChange} accept={FILE_IMAGE_ACCEPT} name="collectionThumbnail" />
	</div>

	{#if thumbnailLoading}
		<ImagePlaceholder imgOnly class="mt-8 mb-8" />
	{:else if thumbnailBase64.length > 0 && thumbnailFile !== undefined}
		<img
			src={thumbnailBase64}
			class="mt-3 mb-3 block object-cover m-auto !w-[{COLLECTION_THUMBNAIL_WIDTH}px] !h-[{COLLECTION_THUMBNAIL_HEIGHT}px]"
			alt="collection thumbnial preview of {thumbnailFile?.name}"
		/>
	{/if}

	<Button
		disabled={createCollectionButtonDisabled}
		type="submit"
		class="w-full {thumbnailFile !== null && 'mt-5 mb-10'}"
	>
		<CalendarEditSolid class="w-3.5 h-3.5 me-2.5 text-white" /> Create collection
	</Button>
</form>
