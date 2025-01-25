<script lang="ts">
	import { fileToBase64String } from '$lib/client/helpers/images';
	import { MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB } from '$lib/shared/constants/images';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Fileupload from 'flowbite-svelte/Fileupload.svelte';
	import ImagePlaceholder from 'flowbite-svelte/ImagePlaceholder.svelte';
	import Label from 'flowbite-svelte/Label.svelte';

	type Props = {
		isChangingProfilePicture?: boolean;
		profilePictureFile?: File | null;
	};

	let { isChangingProfilePicture = false, profilePictureFile = $bindable(null) }: Props = $props();

	let profilePictureBase64String: string | null = $state(null);
	let parsingProfilePicture = $state(false);

	const onProfilePictureChange = async (event: Event) => {
		profilePictureFile = null;
		parsingProfilePicture = true;

		const target = event.target as HTMLInputElement;
		const files = Array.from(target.files ?? []);
		if (files.length === 1) {
			profilePictureFile = files[0];

			if (profilePictureFile) {
				try {
					profilePictureBase64String = await fileToBase64String(profilePictureFile);
				} catch {
					profilePictureBase64String = null;
				}
			}
		}

		parsingProfilePicture = false;
	};
</script>

<Label style="margin-top: 0px;" class="space-y-2">
	<span>Upload a profile picture{isChangingProfilePicture ? '' : ' (optional)'}</span>
	<br />
	<span>The maximum size allowed is: {MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB} MB</span>
	<Fileupload
		id={isChangingProfilePicture ? 'newProfilePictureInput' : 'profilePictureInput'}
		name={isChangingProfilePicture ? 'newProfilePicture' : 'profilePicture'}
		accept="image/*"
		on:change={onProfilePictureChange}
	/>
</Label>

{#if parsingProfilePicture}
	<ImagePlaceholder />
{:else if profilePictureFile && profilePictureBase64String}
	<Avatar class="block ml-auto mr-auto" size="xl" src={profilePictureBase64String} />
{/if}
