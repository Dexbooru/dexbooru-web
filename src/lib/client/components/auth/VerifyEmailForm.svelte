<script lang="ts">
	import { enhance } from '$app/forms';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import EnvelopeSolid from 'flowbite-svelte-icons/EnvelopeSolid.svelte';

	type Props = {
		emailVerified: boolean;
	};

	let { emailVerified }: Props = $props();

	let resendLoading = $state(false);
</script>

{#if !emailVerified}
	<Card class="p-6 sm:p-8">
		<div class="mb-4 flex items-center gap-2">
			<EnvelopeSolid class="h-5 w-5 text-amber-500" />
			<h3 class="text-xl font-medium text-gray-900 dark:text-white">Verify your email</h3>
		</div>
		<p class="mb-4 text-gray-600 dark:text-gray-400">
			Your email address is not verified. Please check your inbox for the verification link we sent
			when you signed up.
		</p>
		<form
			use:enhance={() => {
				resendLoading = true;
				return async ({ result }) => {
					resendLoading = false;
					if (result.type === 'success' && result.data?.success) {
						toast.push('Verification email sent! Check your inbox.', SUCCESS_TOAST_OPTIONS);
					} else if (result.type === 'failure') {
						const message = result.data?.message ?? 'Failed to send verification email';
						toast.push(message, FAILURE_TOAST_OPTIONS);
					} else if (result.type === 'success') {
						toast.push(result.data?.message ?? 'Verification email sent!', SUCCESS_TOAST_OPTIONS);
					}
				};
			}}
			method="POST"
			action="?/resendVerification"
			class="flex flex-col space-y-4"
		>
			<Button disabled={resendLoading} type="submit" color="light">
				{resendLoading ? 'Sending...' : 'Resend verification email'}
			</Button>
		</form>
	</Card>
{/if}
