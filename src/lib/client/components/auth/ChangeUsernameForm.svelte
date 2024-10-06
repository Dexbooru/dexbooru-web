<script lang="ts">
	import { changeUsernameFormAuthRequirementsStore } from '$lib/client/stores/forms';
	import { Alert, Button, Card } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
	import AuthInput from './AuthInput.svelte';

	export let error: string | null = null;
	export let errorType: string | null = null;

	let newUsername: string = '';
	let changeUsernameButtonDisabled = true;

	const changeUsernameFormAuthRequirementsUnsubscribe =
		changeUsernameFormAuthRequirementsStore.subscribe((data) => {
			const disabledCheck = newUsername.length > 0 && data.username?.unsatisfied.length === 0;
			changeUsernameButtonDisabled = !disabledCheck;
		});

	onDestroy(() => {
		changeUsernameFormAuthRequirementsUnsubscribe();
	});
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		Change Username
	</h3>
	<form method="POST" action="?/username" class="flex flex-col space-y-2">
		<AuthInput
			bind:input={newUsername}
			inputFieldType="username"
			inputName="newUsername"
			labelTitle="Enter your new username"
			labelStyling="margin-bottom: 10px;"
			formStore={changeUsernameFormAuthRequirementsStore}
		/>
		<Button disabled={changeUsernameButtonDisabled} type="submit">Change Username</Button>

		{#if error !== null && errorType === 'username'}
			<Alert dismissable border color="red" class="mt-2">
				<span class="font-medium">Username error!</span>
				{error}
			</Alert>
		{/if}
	</form>
</Card>
