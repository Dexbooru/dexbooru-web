<script lang="ts">
	import { enhance } from '$app/forms';
	import { generateUserTotp } from '$lib/client/api/auth';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUserPreferences } from '$lib/client/helpers/context';
	import type { TGeneratedOtpData } from '$lib/client/types/auth';
	import { TOTP_CODE_LENGTH } from '$lib/shared/constants/totp';
	import type { TApiResponse } from '$lib/shared/types/api';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Img from 'flowbite-svelte/Img.svelte';
	import AuthInput from './AuthInput.svelte';

	let currentPassword: string = $state('');
	let totpLoading: boolean = $state(false);
	let totpUri: string = $state('');
	let otpCode: string = $state('');

	const userPreferences = getAuthenticatedUserPreferences();

	const handleTotpGeneration = async () => {
		if (currentPassword.length === 0 || totpUri.length > 0) return;

		totpUri = '';
		totpLoading = true;

		const response = await generateUserTotp(currentPassword);
		if (response.ok) {
			const responseData: TApiResponse<TGeneratedOtpData> = await response.json();
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
		<span class="text-sm">(2-factor authentication)</span>
	</h3>
	<form
		use:enhance={async ({ cancel }) => {
			if (totpUri.length === 0) {
				handleTotpGeneration();
				cancel();
			}

			totpLoading = true;
			return async ({ result }) => {
				totpLoading = false;
				if (result.type === 'success') {
					toast.push('The 2FA was enabled successfully on your account!', SUCCESS_TOAST_OPTIONS);
					userPreferences.update((currentPreferences) => {
						return { ...currentPreferences, twoFactorAuthenticationEnabled: true };
					});
				} else {
					toast.push(
						'An error occured while trying to enable 2FA on your account',
						FAILURE_TOAST_OPTIONS,
					);
				}
			};
		}}
		method="POST"
		action="?/twoFactorAuthentication"
		class="flex flex-col space-y-4"
	>
		<AuthInput
			bind:input={currentPassword}
			bind:comparisonInput={currentPassword}
			labelTitle="Confirm your password"
			inputFieldType="password-confirm"
			inputName="password"
		/>
		{#if $userPreferences.twoFactorAuthenticationEnabled}
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
				<Img class="m-auto" width="256" height="256" src={totpUri} alt="Generated TOTP to scan" />
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
	</form>
</Card>
