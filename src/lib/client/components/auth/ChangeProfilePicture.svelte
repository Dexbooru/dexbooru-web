<script lang="ts">
	import { enhance } from '$app/forms';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUser } from '$lib/client/helpers/context';
	import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Card, Checkbox, Input } from 'flowbite-svelte';
	import ProfilePictureUpload from '../files/ProfilePictureUpload.svelte';

	const user = getAuthenticatedUser();

	let profilePictureChanging: boolean = $state(false);
	let profilePictureFile: File | null = $state(null);
	let removeProfilePicture = $state(false);
	let changeProfileButtonDisabled = $derived.by(() => {
		if (removeProfilePicture) {
			return false;
		}
		return (
			profilePictureFile === null ||
			(profilePictureFile !== null &&
				!isFileImage(profilePictureFile) &&
				!isFileImageSmall(profilePictureFile, 'profilePicture'))
		);
	});

	const onRemoveProfileCheckedChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const newProfilePictureFileInput = document.getElementById(
			'newProfilePictureInput',
		) as HTMLInputElement;

		if (target.checked) {
			profilePictureFile = null;
			newProfilePictureFileInput.value = '';
		}
	};
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		Change Profile Picture
	</h3>
	<form
		use:enhance={() => {
			profilePictureChanging = true;

			return async ({ result }) => {
				profilePictureChanging = false;
				if (result.type === 'success') {
					toast.push('The profile picture was updated successfully!', SUCCESS_TOAST_OPTIONS);
					// @ts-ignore
					user.update((currentUser) => {
						// @ts-ignore
						const updatedUser = { ...currentUser, ...result.data.data };
						return updatedUser;
					});
				} else {
					toast.push(
						'An error occured while trying to change the profile picture',
						FAILURE_TOAST_OPTIONS,
					);
				}
			};
		}}
		method="POST"
		action="?/profilePicture"
		enctype="multipart/form-data"
		class="flex flex-col space-y-3"
	>
		<ProfilePictureUpload bind:profilePictureFile isChangingProfilePicture />
		<span class="text-center">------- OR -------</span>
		<Checkbox on:change={onRemoveProfileCheckedChange} bind:checked={removeProfilePicture}
			>Remove Profile Picture</Checkbox
		>
		<Input type="hidden" name="removeProfilePicture" value={removeProfilePicture} />
		<Button disabled={changeProfileButtonDisabled || profilePictureChanging} type="submit"
			>Change Profile Picture</Button
		>
	</form>
</Card>
