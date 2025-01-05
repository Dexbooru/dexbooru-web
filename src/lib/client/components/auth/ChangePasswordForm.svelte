<script lang="ts">
	import { enhance } from '$app/forms';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import {
		getAuthenticatedUser,
		getChangePasswordAuthRequirements,
	} from '$lib/client/helpers/context';
	import { toast } from '@zerodevx/svelte-toast';
	import { Button, Card } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import AuthInput from './AuthInput.svelte';

	const changePasswordRequirements = getChangePasswordAuthRequirements();
	const user = getAuthenticatedUser();

	let passwordChanging: boolean = $state(false);
	let oldPassword: string = $state('');
	let newPassword: string = $state('');
	let confirmedNewPassword: string = $state('');
	let changePasswordButtonDiabled = $state(true);

	const changePasswordFormAuthRequirementsUnsubscribe = changePasswordRequirements.subscribe(
		(data) => {
			const disabledCheck =
				oldPassword.length > 0 &&
				newPassword.length > 0 &&
				confirmedNewPassword.length > 0 &&
				data.password?.unsatisfied.length === 0 &&
				data.confirmedPassword === true;
			changePasswordButtonDiabled = !disabledCheck;
		},
	);

	onMount(() => {
		return () => {
			changePasswordFormAuthRequirementsUnsubscribe();
		};
	});
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		Change Password
	</h3>
	<form
		use:enhance={() => {
			passwordChanging = true;
			return async ({ result }) => {
				passwordChanging = false;
				if (result.type === 'success') {
					toast.push('The password was updated successfully!', SUCCESS_TOAST_OPTIONS);
					// @ts-ignore
					user.update((currentUser) => {
						// @ts-ignore
						const updatedUser = { ...currentUser, ...result.data.data };
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
		<Button disabled={changePasswordButtonDiabled || passwordChanging} type="submit"
			>Change Password</Button
		>
	</form>
</Card>
