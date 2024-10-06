<script lang="ts">
	import { Alert, Button, Card } from 'flowbite-svelte';
	import AuthInput from './AuthInput.svelte';

	export let error: string | null = null;
	export let errorType: string | null = null;

	let newUsername: string = '';
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
		/>
		<Button disabled={newUsername.length === 0} type="submit">Change Username</Button>

		{#if error !== null && errorType === 'username'}
			<Alert dismissable border color="red" class="mt-2">
				<span class="font-medium">Username error!</span>
				{error}
			</Alert>
		{/if}
	</form>
</Card>
