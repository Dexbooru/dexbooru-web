<script lang="ts">
	import { ACCOUNT_DELETION_CONFIRMATION_TEXT } from '$lib/shared/constants/auth';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import { slide } from 'svelte/transition';
	import AuthInput from './AuthInput.svelte';

	let confirmedPassword: string = $state('');
	let confirmationText: string = $state('');
</script>

<Card class="p-6 sm:p-8">
	<h3 class="mb-5 text-center text-xl font-medium text-gray-900 dark:text-white">
		DELETE YOUR ACCOUNT PERMANENTELY!
	</h3>
	<form method="POST" action="?/deleteAccount" class="flex flex-col space-y-2">
		<Label class="mb-3 space-y-2">
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
	</form>
</Card>
