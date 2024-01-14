<script lang="ts">
	import { fileToBase64String } from '$lib/client/helpers/images';
	import { MAXIMUM_IMAGES_PER_POST } from '$lib/shared/constants/images';
	import { Fileupload, Label, P, Spinner } from 'flowbite-svelte';
	import ImagePreviewModal from '../images/ImagePreviewModal.svelte';

	let pictures: { imageBase64: string; file: File }[] = [];
	let loadingPictures = false;
	let errorMessage: string | null = null;

	const resetFileUploadState = () => {
		pictures = [];
		loadingPictures = false;
	};

	const handleFileUploadError = (error: Error) => {
		errorMessage = error.message;
		resetFileUploadState();
	};

	const onFileChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const files: FileList | null = target.files;
		errorMessage = null;
		resetFileUploadState();

		if (!files) {
			handleFileUploadError(new Error('Did not upload any files'));
			resetFileUploadState();
			return;
		}

		if (files.length > MAXIMUM_IMAGES_PER_POST) {
			handleFileUploadError(new Error(`Cannot upload more than ${MAXIMUM_IMAGES_PER_POST} files`));
			resetFileUploadState();
			return;
		}

		for (let i = 0; i < files.length; i++) {
			if (files[i]) {
				loadingPictures = true;
				let imageBase64: string | null = null;
				try {
					imageBase64 = await fileToBase64String(files[i]);
				} catch (error) {
					handleFileUploadError(error as Error);
					break;
				}
				if (imageBase64) {
					pictures.push({ imageBase64, file: files[i] });
				} else {
					handleFileUploadError(new Error('Null base64 string detected for an image!'));
					break;
				}
				loadingPictures = false;
			}
		}
	};
</script>

<Label class="space-y-2 mx-2.5 mb-2">
	<span>Upload up to {MAXIMUM_IMAGES_PER_POST} images</span>
	<Fileupload name="postPictures" accept="image/*" multiple on:change={onFileChange} />
</Label>

{#if loadingPictures}
	<Spinner class="block ml-auto mr-auto" size="10" />
{:else if pictures.length && !errorMessage}
	<P size="2xl" class="text-center mt-5">Images Preview</P>
	<div class="flex flex-wrap space-x-3">
		{#each pictures as { imageBase64, file }}
			<ImagePreviewModal {imageBase64} imageFile={file} />
		{/each}
	</div>
{:else if errorMessage}
	<P>{errorMessage}</P>
{/if}
