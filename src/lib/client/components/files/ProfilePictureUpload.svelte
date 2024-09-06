<script lang="ts">
	import { fileToBase64String } from '$lib/client/helpers/images';
	import { Avatar, Fileupload, ImagePlaceholder, Label } from 'flowbite-svelte';

	export let isChangingProfilePicture: boolean = false;

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
</script>

<Label style="margin-top: 0px;" class="space-y-2">
	<span>Upload a profile picture{isChangingProfilePicture ? '' : ' (optional)'}</span>
	<Fileupload
		required={isChangingProfilePicture}
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
