<script lang="ts">
	import { fileToBase64String } from '$lib/client/helpers/images';
	import { MAXIMUM_IMAGES_PER_POST, PROFILE_PICTURE_WIDTH } from '$lib/shared/constants/images';
	import { Fileupload, ImagePlaceholder, Label, P } from 'flowbite-svelte';

	let pictureBase64Strings: string[] = [];
	let parsingPicture = false;
	let pictureFiles: File[] = [];
	let errorMessage: string | null = null;

	const onFileChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		let files: FileList | null = target.files;
		errorMessage = null;

		if (files) {
			if (files.length > MAXIMUM_IMAGES_PER_POST) {
				catchError(`Cannot upload more than ${MAXIMUM_IMAGES_PER_POST} files`);
			} else {
				for (let i = 0; i < files.length; i++) {
					if (files[i]) {
						parsingPicture = true;
						let base64String: string | null = null;
						try {
							base64String = await fileToBase64String(files[i]);
						} catch (error) {
							catchError(error);
							break;
						}
						if (base64String) {
							pictureBase64Strings.push(base64String);
							pictureFiles.push(files[i]);
						} else {
							catchError('Null base64 string detected for an image!');
							break;
						}
						parsingPicture = false;
					}
				}
			}
		} else {
			catchError('Did not upload any files');
		}
	};

	const catchError = (error: any) => {
		console.error(error);
		errorMessage = error;
		pictureBase64Strings = [];
		pictureFiles = [];
		parsingPicture = false;
	};
</script>

<Label class="space-y-2 mx-2.5">
	<span>Upload Up to {MAXIMUM_IMAGES_PER_POST} images</span>
	<Fileupload
		id="PostPictureInput"
		name="postPictures"
		accept="image/*"
		multiple
		on:change={onFileChange}
	/>
</Label>

{#if parsingPicture}
	<ImagePlaceholder />
{:else if pictureFiles.length && pictureBase64Strings.length && !errorMessage}
	<P size="2xl" class="text-center mt-5">Image Preview</P>
	{#each pictureBase64Strings as src}
		<img class="block ml-auto mr-auto rounded-sm my-5" width={PROFILE_PICTURE_WIDTH} {src} alt="" />
	{/each}
{:else if errorMessage}
	<P>{errorMessage}</P>
{/if}
