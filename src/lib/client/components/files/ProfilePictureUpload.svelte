<script lang="ts">
	import { fileToBase64String } from '$lib/client/helpers/images';
	import { PROFILE_PICTURE_HEIGHT, PROFILE_PICTURE_WIDTH } from '$lib/shared/constants/images';
	import { Avatar, Fileupload, ImagePlaceholder, Label } from 'flowbite-svelte';

	// onMount(() => {
	// 	profilePictureInput = document.querySelector('#profilePictureInput') as HTMLInputElement | null;
	// });

	const onProfilePictureChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			profilePictureFile = target.files.item(0);

			if (profilePictureFile) {
				parsingProfilePicture = true;

				try {
					profilePictureBase64String = await fileToBase64String(profilePictureFile);
				} catch {
					profilePictureBase64String = null;
				}

				parsingProfilePicture = false;
			}
		}
	};

	let profilePictureFile: File | null = null;
	let profilePictureBase64String: string | null = null;
	let parsingProfilePicture = false;
	// let profilePictureInput: HTMLInputElement | null = null;
</script>

<Label class="space-y-2">
	<span>Upload a profile picture (optional)</span>
	<Fileupload
		id="profilePictureInput"
		name="profilePicture"
		accept="image/*"
		on:change={onProfilePictureChange}
	/>
</Label>

{#if parsingProfilePicture}
	<ImagePlaceholder />
{:else if profilePictureFile && profilePictureBase64String}
	<Avatar class="block ml-auto mr-auto" size="xl" src={profilePictureBase64String} />
	{PROFILE_PICTURE_HEIGHT}
	{PROFILE_PICTURE_WIDTH}
{/if}
