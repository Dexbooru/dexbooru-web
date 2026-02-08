<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PasswordRecoveryAttempt } from '$generated/prisma/browser';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getChangePasswordAuthRequirements } from '$lib/client/helpers/context';
	import type { TUser } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import { onMount } from 'svelte';
	import AuthInput from './AuthInput.svelte';

	type Props = {
		passwordRecoveryAttempt: PasswordRecoveryAttempt & { user: TUser };
	};

	let { passwordRecoveryAttempt }: Props = $props();

	let newPassword = $state('');
	let confirmedNewPassword = $state('');
	let passwordUpdating = $state(false);
	let updatePasswordButtonDisabled = $state(true);

	const changePasswordRequirements = getChangePasswordAuthRequirements();
	const changePasswordRequirementsUnsubscribe = changePasswordRequirements.subscribe((data) => {
		const disabledCheck =
			newPassword.length > 0 &&
			confirmedNewPassword.length > 0 &&
			data.password?.unsatisfied.length === 0 &&
			data.confirmedPassword === true;
		updatePasswordButtonDisabled = !disabledCheck;
	});

	onMount(() => {
		return () => {
			changePasswordRequirementsUnsubscribe();
		};
	});
</script>

<Card class="mt-20 p-5">
	<h3 class="mb-5 text-center text-xl font-medium text-gray-900 dark:text-white">
		Account Recovery
	</h3>
	<div class="mb-3 flex-col space-y-1">
		<p class="text-left text-sm text-gray-600 dark:text-gray-400">
			Hey {passwordRecoveryAttempt.user.username}, you're almost there! Just enter your new password
			below.
		</p>
	</div>

	<form
		use:enhance={() => {
			passwordUpdating = true;

			return async ({ result }) => {
				passwordUpdating = false;

				if (result.type === 'success') {
					goto(resolve('/login?passwordReset=true'), { replaceState: true });
				} else {
					toast.push(
						'An unexpected error occured while updating the password!',
						FAILURE_TOAST_OPTIONS,
					);
				}
			};
		}}
		method="POST"
		class="flex flex-col space-y-6"
	>
		<AuthInput
			labelTitle="New Password"
			bind:input={newPassword}
			inputFieldType="password"
			inputName="newPassword"
			formStore={changePasswordRequirements}
		/>
		<AuthInput
			labelTitle="Confirm New Password"
			bind:input={confirmedNewPassword}
			bind:comparisonInput={newPassword}
			inputFieldType="password-confirm"
			inputName="confirmedNewPassword"
			showRequirements={false}
			formStore={changePasswordRequirements}
		/>

		<Input
			type="hidden"
			name="passwordRecoveryAttemptId"
			value={passwordRecoveryAttempt.id?.toString()}
		/>
		<Input type="hidden" name="userId" value={passwordRecoveryAttempt.userId?.toString()} />

		<Button disabled={updatePasswordButtonDisabled || passwordUpdating} type="submit" class="w-full"
			>Update your password</Button
		>
	</form>
</Card>
