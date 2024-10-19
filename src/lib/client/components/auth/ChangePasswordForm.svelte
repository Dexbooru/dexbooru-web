<script lang="ts">
	import { getChangePasswordAuthRequirements } from '$lib/client/helpers/context';
	import { Alert, Button, Card } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
	import AuthInput from './AuthInput.svelte';

	export let error: string | null = null;
	export let errorType: string | null = null;

	const changePasswordRequirements = getChangePasswordAuthRequirements();
	let oldPassword: string = '';
	let newPassword: string = '';
	let confirmedNewPassword: string = '';
	let changePasswordButtonDiabled = true;

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

	onDestroy(() => {
		changePasswordFormAuthRequirementsUnsubscribe();
	});
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		Change Password
	</h3>
	<form method="POST" action="?/password" class="flex flex-col space-y-4">
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
		<Button disabled={changePasswordButtonDiabled} type="submit">Change Password</Button>

		{#if error !== null && errorType === 'password'}
			<Alert dismissable border color="red" class="mt-2">
				<span class="font-medium">Password error!</span>
				{error}
			</Alert>
		{/if}
	</form>
</Card>
