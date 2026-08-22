<script lang="ts">
	import { enhance } from '$app/forms';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getAuthenticatedUser,
		getChangePasswordAuthRequirements,
	} from '$lib/client/helpers/context';
	import type { TUser } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import AuthInput from './AuthInput.svelte';

	const changePasswordRequirements = getChangePasswordAuthRequirements();
	const user = getAuthenticatedUser();

	let passwordChanging = $state(false);
	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmedNewPassword = $state('');

	const changePasswordButtonDisabled = $derived.by(() => {
		const data = $changePasswordRequirements;
		const isValid =
			oldPassword.length > 0 &&
			newPassword.length > 0 &&
			confirmedNewPassword.length > 0 &&
			(data.password?.unsatisfied?.length ?? 1) === 0 &&
			data.confirmedPassword === true;
		return !isValid || passwordChanging;
	});
</script>

<Card class="p-6 sm:p-8">
	<h3 class="mb-5 text-center text-xl font-medium text-gray-900 dark:text-white">
		Change Password
	</h3>
	<form
		use:enhance={() => {
			passwordChanging = true;
			return async ({ result }) => {
				passwordChanging = false;
				if (result.type === 'success') {
					toast.push('The password was updated successfully!', SUCCESS_TOAST_OPTIONS);
					user.update((currentUser) => {
						if (!result.data) return currentUser;

						const newUserData = result.data.data as TUser;
						const updatedUser = { ...currentUser, ...newUserData };
						return updatedUser;
					});
				} else {
					toast.push('An error occured while trying to change the password', FAILURE_TOAST_OPTIONS);
				}
			};
		}}
		method="POST"
		action="?/password"
		class="flex flex-col space-y-4"
		onsubmit={(event) => {
			if (changePasswordButtonDisabled) event.preventDefault();
		}}
	>
		<AuthInput
			bind:input={oldPassword}
			showRequirements={false}
			labelTitle="Enter your old password"
			inputFieldType="password"
			inputName="oldPassword"
		/>
		<AuthInput
			bind:input={newPassword}
			labelTitle="Enter your new password"
			inputFieldType="password"
			inputName="newPassword"
			formStore={changePasswordRequirements}
		/>
		<AuthInput
			bind:input={confirmedNewPassword}
			bind:comparisonInput={newPassword}
			labelTitle="Confirm your new password"
			inputFieldType="password-confirm"
			inputName="confirmedNewPassword"
			formStore={changePasswordRequirements}
		/>
		<Button
			disabled={changePasswordButtonDisabled}
			type="submit"
			class={changePasswordButtonDisabled ? '' : 'opacity-100!'}
		>
			Change Password
		</Button>
	</form>
</Card>
