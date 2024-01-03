<script lang="ts">
	import { fileToBase64String } from '$lib/client/helpers/images';
	import { PROFILE_PICTURE_HEIGHT, PROFILE_PICTURE_WIDTH } from '$lib/shared/constants/images';
	import { Avatar, Fileupload, ImagePlaceholder, Label } from 'flowbite-svelte';

	// onMount(() => {
	// 	profilePictureInput = document.querySelector('#profilePictureInput') as HTMLInputElement | null;
	// });

	let PictureBase64Strings: string[] = [];
	let parsingPicture = false;
	let PictureFiles: File[] = [];

	const onFileChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const files: FileList | null = target.files;

		if (files) {
			for (let i = 0; i < files.length; i++) {
				if (files[i]) {
					parsingPicture = true;
					let Base64String: string | null = null;
					try {
						Base64String = await fileToBase64String(files[i]);
					} catch (error) {
						console.error(error);
						PictureBase64Strings = [];
						PictureFiles = [];
						parsingPicture = false;
						break;
					}
					if (Base64String) {
						PictureBase64Strings.push(Base64String);
						PictureFiles.push(files[i]);
					} else {
						//if string is null, something is wrong with the file upload
						console.error('Null base 64 string for photo!');
						PictureBase64Strings = [];
						PictureFiles = [];
						parsingPicture = false;
						break;
					}
					parsingPicture = false;
				}
			}
		}
		console.log(PictureBase64Strings);
	};

	// let profilePictureInput: HTMLInputElement | null = null;
</script>

<Label class="space-y-2">
	<span>Upload Up to 10 images</span>
	<Fileupload
		id="PostPictureInput"
		name="PostPictures"
		accept="image/*"
		multiple
		on:change={onFileChange}
	/>
</Label>

{#if parsingPicture}
	<ImagePlaceholder />
{:else if PictureFiles && PictureBase64Strings}
	{#each PictureBase64Strings as src (src)}
		{#if src !== null}
			<Avatar class="block ml-auto mr-auto" size="xl" {src} />
		{/if}
	{/each}
	{PROFILE_PICTURE_HEIGHT}
	{PROFILE_PICTURE_WIDTH}
{/if}
