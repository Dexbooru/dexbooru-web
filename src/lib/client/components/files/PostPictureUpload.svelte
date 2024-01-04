<script lang="ts">
	import { fileToBase64String } from '$lib/client/helpers/images';
	import { PROFILE_PICTURE_WIDTH } from '$lib/shared/constants/images';
	import { Fileupload, ImagePlaceholder, Label, P } from 'flowbite-svelte';

	// onMount(() => {
	// 	profilePictureInput = document.querySelector('#profilePictureInput') as HTMLInputElement | null;
	// });

	let PictureBase64Strings: string[] = [];
	let parsingPicture = false;
	let PictureFiles: File[] = [];
	let errorMessage: string | null = null;

	const onFileChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const files: FileList | null = target.files;

		if (files) {
			if (files.length > 10) {
				catchError('Cannot upload more than 10 files');
			} else {
				for (let i = 0; i < files.length; i++) {
					if (files[i]) {
						parsingPicture = true;
						let Base64String: string | null = null;
						try {
							Base64String = await fileToBase64String(files[i]);
						} catch (error) {
							catchError(error);
							break;
						}
						if (Base64String) {
							PictureBase64Strings.push(Base64String);
							PictureFiles.push(files[i]);
						} else {
							//if string is null, something is wrong with the file upload
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
		PictureBase64Strings = [];
		PictureFiles = [];
		parsingPicture = false;
	};

	// let profilePictureInput: HTMLInputElement | null = null;
</script>

<Label class="space-y-2 mx-2.5">
	<span>Upload Up to 10 images</span>
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
{:else if PictureFiles.length && PictureBase64Strings.length && !errorMessage}
	<P size="2xl" class="text-center mt-5">Image Preview</P>
	{#each PictureBase64Strings as src}
		<img class="block ml-auto mr-auto rounded-sm my-5" width={PROFILE_PICTURE_WIDTH} {src} alt="" />
	{/each}
{:else if errorMessage}
	<P>{errorMessage}</P>
{/if}
