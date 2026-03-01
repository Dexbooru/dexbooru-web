<script lang="ts">
	import { fileToBase64String } from '$lib/client/helpers/images';
	import { MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB } from '$lib/shared/constants/images';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Fileupload from 'flowbite-svelte/Fileupload.svelte';
	import ImagePlaceholder from 'flowbite-svelte/ImagePlaceholder.svelte';
	import Label from 'flowbite-svelte/Label.svelte';

	import ProfilePictureCropModal from './ProfilePictureCropModal.svelte';

	type Props = {
		isChangingProfilePicture?: boolean;
		profilePictureFile?: File | null;
	};

	let { isChangingProfilePicture = false, profilePictureFile = $bindable(null) }: Props = $props();

	let profilePictureBase64String: string | null = $state(null);
	let parsingProfilePicture = $state(false);
	let cropModalOpen = $state(false);

	const inputId = $derived(
		isChangingProfilePicture ? 'newProfilePictureInput' : 'profilePictureInput',
	);
	const inputName = $derived(isChangingProfilePicture ? 'newProfilePicture' : 'profilePicture');

	const onProfilePictureChange = async (event: Event) => {
		profilePictureFile = null;
		profilePictureBase64String = null;
		parsingProfilePicture = true;

		const target = event.target as HTMLInputElement;
		const files = Array.from(target.files ?? []);
		if (files.length === 1) {
			const file = files[0] ?? null;

			if (file) {
				try {
					const base64 = await fileToBase64String(file);
					if (base64) {
						profilePictureBase64String = base64;
						cropModalOpen = true;
					}
				} catch {
					profilePictureBase64String = null;
				}
			}
		}

		parsingProfilePicture = false;
	};

	function setFileInput(file: File) {
		const input = document.getElementById(inputId) as HTMLInputElement | null;
		if (input) {
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(file);
			input.files = dataTransfer.files;
		}
	}

	function clearFileInput() {
		const input = document.getElementById(inputId) as HTMLInputElement | null;
		if (input) {
			input.value = '';
		}
	}

	async function handleCropConfirm(croppedFile: File) {
		profilePictureFile = croppedFile;
		setFileInput(croppedFile);
		profilePictureBase64String = await fileToBase64String(croppedFile);
		cropModalOpen = false;
	}

	function handleCropCancel() {
		cropModalOpen = false;
		profilePictureBase64String = null;
		profilePictureFile = null;
		clearFileInput();
	}
</script>

<Label style="margin-top: 0px;" class="space-y-2">
	<span>Upload a profile picture{isChangingProfilePicture ? '' : ' (optional)'}</span>
	<br />
	<span>The maximum size allowed is: {MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB} MB</span>
	<Fileupload id={inputId} name={inputName} accept="image/*" onchange={onProfilePictureChange} />
</Label>

{#if parsingProfilePicture}
	<ImagePlaceholder />
{:else if profilePictureFile && profilePictureBase64String}
	<Avatar class="mr-auto ml-auto block" size="xl" src={profilePictureBase64String} />
{/if}

{#if profilePictureBase64String && cropModalOpen}
	<ProfilePictureCropModal
		bind:open={cropModalOpen}
		imageSrc={profilePictureBase64String}
		onConfirm={handleCropConfirm}
		onCancel={handleCropCancel}
	/>
{/if}
