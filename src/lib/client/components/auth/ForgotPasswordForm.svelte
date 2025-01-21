<script lang="ts">
	import { enhance } from '$app/forms';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { EMAIL_REGEX } from '$lib/shared/constants/auth';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';

	let email: string = $state('');
	let forgotPasswordEmailSending = $state(false);
</script>

<Card class="mt-20">
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		Account Recovery
	</h3>
	<div class="flex-col space-y-1 mb-3">
		<p class="text-sm text-left text-gray-600 dark:text-gray-400">
			Enter the email address associated with your Dexbooru account.
		</p>
		<p class="text-sm text-left text-gray-600 dark:text-gray-400">
			We will send a password recovery email to your inbox.
		</p>
	</div>

	<form
		use:enhance={() => {
			forgotPasswordEmailSending = true;

			return async ({ result }) => {
				forgotPasswordEmailSending = false;
				if (result.type === 'success') {
					toast.push(
						'A password recovery email has been sent to your inbox!',
						SUCCESS_TOAST_OPTIONS,
					);
				} else {
					toast.push(
						'An unexpected error occured while sending the account recovery email!',
						FAILURE_TOAST_OPTIONS,
					);
				}
			};
		}}
		method="POST"
		class="flex flex-col space-y-6"
	>
		<Label class="space-y-2">
			<span>Email</span>
			<Input
				autofocus
				bind:value={email}
				type="email"
				name="email"
				placeholder="Your email"
				required
			/>
		</Label>

		<Button
			disabled={!EMAIL_REGEX.test(email) || forgotPasswordEmailSending}
			type="submit"
			class="w-full">Send Recovery Email</Button
		>
	</form>
</Card>
