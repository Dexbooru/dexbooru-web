<script lang="ts">
	import { Alert, Button, Card } from 'flowbite-svelte';
	import ProfilePictureUpload from '../files/ProfilePictureUpload.svelte';

	export let error: string | null = null;
	export let errorType: string | null = null;

	let profilePictureFile: File | null = null;
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		Change Profile Picture
	</h3>
	<form
		method="POST"
		action="?/profilePicture"
		enctype="multipart/form-data"
		class="flex flex-col space-y-3"
	>
		<ProfilePictureUpload bind:profilePictureFile isChangingProfilePicture />
		<Button disabled={profilePictureFile === null} type="submit">Change Profile Picture</Button>

		{#if error !== null && errorType === 'profile-picture'}
			<Alert dismissable border color="red" class="mt-2">
				<span class="font-medium">Profile picture error!</span>
				{error}
			</Alert>
		{/if}
	</form>
</Card>
