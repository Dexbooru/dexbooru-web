<script lang="ts">
	import { generateUserTotp } from '$lib/client/api/auth';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { userPreferenceStore } from '$lib/client/stores/users';
	import type { IGeneratedOtpData } from '$lib/client/types/auth';
	import { TOTP_CODE_LENGTH } from '$lib/shared/constants/totp';
	import type { TApiResponse } from '$lib/shared/types/api';
	import { toast } from '@zerodevx/svelte-toast';
	import { Alert, Button, Card } from 'flowbite-svelte';
	import AuthInput from './AuthInput.svelte';

	export let error: string | null | undefined;
	export let errorType: string;

	let currentPassword: string = '';
	let totpLoading: boolean = false;
	let totpUri: string = '';
	let otpCode: string = '';

	const handleTotpGeneration = async () => {
		if (currentPassword.length === 0 || totpUri.length > 0) return;

		totpUri = '';
		totpLoading = true;

		const response = await generateUserTotp(currentPassword);
		if (response.ok) {
			const responseData: TApiResponse<IGeneratedOtpData> = await response.json();
			totpUri = responseData.data.totpUri;
		} else {
			if (response.status === 401) {
				toast.push('The provided password to your account was incorrect!', FAILURE_TOAST_OPTIONS);
			} else {
				toast.push(
					'An unexpected error occured while trying to generate the TOTP data',
					FAILURE_TOAST_OPTIONS,
				);
			}
		}

		totpLoading = false;
	};
</script>

<Card>
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		2FA
		<br />
		<h2 class="text-sm">(2-factor authentication)</h2>
	</h3>
	<form method="POST" action="?/twoFactorAuthentication" class="flex flex-col space-y-4">
		<AuthInput
			bind:input={currentPassword}
			bind:comparisonInput={currentPassword}
			labelTitle="Confirm your password"
			inputFieldType="password-confirm"
			inputName="password"
		/>
		{#if $userPreferenceStore.twoFactorAuthenticationEnabled}
			<Button type="submit">Disable 2FA on account</Button>
		{:else}
			<Button
				disabled={currentPassword.length === 0 || totpLoading}
				on:click={handleTotpGeneration}
				type="button">Generate QR Code</Button
			>
		{/if}

		{#if totpUri.length > 0}
			<div class="text-center">
				<p class="text-sm mb-4 text-gray-700 dark:text-gray-300">
					Scan the QR code below with your authenticator app (e.g., Google Authenticator, Authy, or
					Microsoft Authenticator) to set up 2FA.
				</p>
				<img class="m-auto" width="256" height="256" src={totpUri} alt="Generated TOTP to scan" />
				<p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
					Need an authenticator app? Try one of these:
					<a
						href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
						target="_blank"
						class="text-blue-600 dark:text-blue-400 underline ml-1">Google Authenticator</a
					>,
					<a
						href="https://authy.com/"
						target="_blank"
						class="text-blue-600 dark:text-blue-400 underline ml-1">Authy</a
					>,
					<a
						href="https://www.microsoft.com/en-us/account/authenticator"
						target="_blank"
						class="text-blue-600 dark:text-blue-400 underline ml-1">Microsoft Authenticator</a
					>
				</p>
			</div>
		{/if}

		{#if totpUri.length > 0}
			<div>
				<AuthInput
					inputFieldType="otp-code"
					labelTitle="TOTP Code ({TOTP_CODE_LENGTH}-digit code)"
					inputName="otpCode"
					bind:input={otpCode}
				/>
			</div>
			<Button
				type="submit"
				disabled={isNaN(parseInt(otpCode)) ||
					otpCode.length !== TOTP_CODE_LENGTH ||
					totpUri.length === 0}
				class="mt-4">Enable 2FA</Button
			>
		{/if}

		{#if error !== null && errorType === 'otp'}
			<Alert dismissable border color="red" class="mt-2">
				<span class="font-medium">Invalid otp code!</span>
				{error}
			</Alert>
		{/if}
	</form>
</Card>
