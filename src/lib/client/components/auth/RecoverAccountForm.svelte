<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PasswordRecoveryAttempt } from '$generated/prisma/browser';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getChangePasswordAuthRequirements } from '$lib/client/helpers/context';
	import type { TUser } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import AuthInput from './AuthInput.svelte';

	type Props = {
		passwordRecoveryAttempt: PasswordRecoveryAttempt & { user: TUser };
	};

	let { passwordRecoveryAttempt }: Props = $props();

	let newPassword = $state('');
	let confirmedNewPassword = $state('');
	let passwordUpdating = $state(false);

	const changePasswordRequirements = getChangePasswordAuthRequirements();
	const updatePasswordButtonDisabled = $derived.by(() => {
		const data = $changePasswordRequirements;
		const isValid =
			newPassword.length > 0 &&
			confirmedNewPassword.length > 0 &&
			(data.password?.unsatisfied?.length ?? 1) === 0 &&
			data.confirmedPassword === true;
		return !isValid || passwordUpdating;
	});
</script>

<Card class="mx-3 mt-20 w-full max-w-md p-5">
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
					goto('/login?passwordReset=true', { replaceState: true });
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
		onsubmit={(event) => {
			if (updatePasswordButtonDisabled) event.preventDefault();
		}}
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

		<Button
			disabled={updatePasswordButtonDisabled}
			type="submit"
			class="w-full {updatePasswordButtonDisabled ? '' : 'opacity-100!'}"
		>
			Update your password
		</Button>
	</form>
</Card>
