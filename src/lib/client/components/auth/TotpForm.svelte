<script lang="ts">
	import { goto } from '$app/navigation';
	import { TOTP_CHALLENGE_EXPIRY_SECONDS, TOTP_CODE_LENGTH } from '$lib/shared/constants/totp';
	import { Alert, Button, Card, Input, Label } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { ActionData } from '../../../../routes/login/totp/[challengeId]/$types';

	interface Props {
		form: ActionData;
		username: string;
		rememberMe: boolean;
	}

	let { form, username, rememberMe }: Props = $props();

	let otpErrorReason = form?.reason ?? null;
	let otpCode: string = $state('');
	let otpFormButtonDisabled = $derived(otpCode.length !== TOTP_CODE_LENGTH);

	onMount(() => {
		const totpTimeoutIntervalId = setTimeout(() => {
			goto('/login');
		}, TOTP_CHALLENGE_EXPIRY_SECONDS * 1000);

		return () => {
			clearInterval(totpTimeoutIntervalId);
		};
	});
</script>

<Card class="w-full max-w-md mt-20">
	<form class="flex flex-col space-y-6" method="POST">
		<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white">
			Complete OTP Challenge
		</h3>
		<p class="text-sm text-center text-gray-500 dark:text-gray-300">
			Hello, <span class="font-semibold">{username}</span>! Please enter the
			<strong>{TOTP_CODE_LENGTH}-digit code</strong> from your authenticator app to complete the authentication.
		</p>
		<p class="text-sm text-center text-gray-500 dark:text-gray-300">
			You have <strong>{Math.floor(TOTP_CHALLENGE_EXPIRY_SECONDS / 60)} minutes</strong> to complete
			the challenge. If the time expires, you'll need to log in again.
		</p>

		<Label class="space-y-2">
			<span>OTP Code</span>
			<Input
				autofocus
				bind:value={otpCode}
				type="text"
				name="otpCode"
				placeholder="Enter the code from your app"
				maxlength={TOTP_CODE_LENGTH}
				required
			/>
		</Label>

		<input type="hidden" name="username" value={username} />
		<input type="hidden" name="rememberMe" value={rememberMe} />

		<Button disabled={otpFormButtonDisabled} type="submit" class="w-full">Submit Code</Button>

		{#if otpErrorReason}
			<Alert color="red">
				<span class="font-medium">TOTP error!</span>
				{otpErrorReason}
			</Alert>
		{/if}
	</form>
</Card>
