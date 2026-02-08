<script lang="ts">
	import { enhance } from '$app/forms';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getAuthenticatedUser,
		getChangeUsernameAuthRequirements,
	} from '$lib/client/helpers/context';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import { onMount } from 'svelte';
	import AuthInput from './AuthInput.svelte';

	const changeUsernameRequirements = getChangeUsernameAuthRequirements();
	const user = getAuthenticatedUser();

	let usernameChanging: boolean = $state(false);
	let newUsername: string = $state('');
	let changeUsernameButtonDisabled = $state(true);

	const changeUsernameFormAuthRequirementsUnsubscribe = changeUsernameRequirements.subscribe(
		(data) => {
			const disabledCheck = newUsername.length > 0 && data.username?.unsatisfied.length === 0;
			changeUsernameButtonDisabled = !disabledCheck;
		},
	);

	onMount(() => {
		return () => {
			changeUsernameFormAuthRequirementsUnsubscribe();
		};
	});
</script>

<Card class="p-6 sm:p-8">
	<h3 class="mb-5 text-center text-xl font-medium text-gray-900 dark:text-white">
		Change Username
	</h3>
	<form
		use:enhance={() => {
			usernameChanging = true;

			return async ({ result }) => {
				usernameChanging = false;
				if (result.type === 'success') {
					toast.push('The username was updated successfully!', SUCCESS_TOAST_OPTIONS);
					user.update((currentUser) => {
						if (!currentUser || !result.data) return currentUser;

						const resultData = result.data.data as { username: string };
						const updatedUser = { ...currentUser, ...resultData };
						return updatedUser;
					});
				} else {
					toast.push('An error occured while trying to change the username', FAILURE_TOAST_OPTIONS);
				}
			};
		}}
		method="POST"
		action="?/username"
		class="flex flex-col space-y-2"
	>
		<AuthInput
			bind:input={newUsername}
			inputFieldType="username"
			inputName="newUsername"
			labelTitle="Enter your new username"
			labelStyling="margin-bottom: 10px;"
			formStore={changeUsernameRequirements}
		/>
		<Button
			disabled={changeUsernameButtonDisabled || usernameChanging || newUsername === $user?.username}
			type="submit">Change Username</Button
		>
	</form>
</Card>
