<script lang="ts">
	import { ACCOUNT_DELETION_CONFIRMATION_TEXT } from '$lib/shared/constants/auth';
	import { Alert, Button, Card, Input, Label } from 'flowbite-svelte';
	import { slide } from 'svelte/transition';
	import AuthInput from './AuthInput.svelte';

	export let error: string | null = null;
	export let errorType: string | null = null;

	let confirmedPassword: string = '';
	let confirmationText: string = '';
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		DELETE YOUR ACCOUNT PERMANENTELY!
	</h3>
	<form method="POST" action="?/deleteAccount" class="flex flex-col space-y-2">
		<Label class="space-y-2 mb-3">
			<span>Enter <em>{ACCOUNT_DELETION_CONFIRMATION_TEXT}</em> phrase below to proceed</span>
			<Input
				bind:value={confirmationText}
				type="text"
				name="deletionConfirmationText"
				placeholder={ACCOUNT_DELETION_CONFIRMATION_TEXT}
				required
			/>
			<AuthInput
				bind:input={confirmedPassword}
				bind:comparisonInput={confirmedPassword}
				labelTitle="Confirm your password"
				inputFieldType="password-confirm"
				inputName="confirmedNewPassword"
			/>
			{#if confirmationText === ACCOUNT_DELETION_CONFIRMATION_TEXT}
				<p transition:slide>We are sad to see you leave 😭</p>
			{/if}
		</Label>
		<Button
			type="submit"
			color="red"
			disabled={confirmationText !== ACCOUNT_DELETION_CONFIRMATION_TEXT ||
				confirmedPassword.length === 0}>DELETE YOUR ACCOUNT</Button
		>

		{#if error !== null && errorType === 'delete-account'}
			<Alert dismissable border color="red" class="mt-2">
				<span class="font-medium">Account deletion error!</span>
				{error}
			</Alert>
		{/if}
	</form>
</Card>
