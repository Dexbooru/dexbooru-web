<script lang="ts">
	import ChangePasswordForm from '$lib/client/components/auth/ChangePasswordForm.svelte';
	import ChangeProfilePicture from '$lib/client/components/auth/ChangeProfilePicture.svelte';
	import ChangeUsernameForm from '$lib/client/components/auth/ChangeUsernameForm.svelte';
	import DeleteAccountForm from '$lib/client/components/auth/DeleteAccountForm.svelte';
	import { SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { SESSION_ID_KEY } from '$lib/shared/constants/session';
	import { toast } from '@zerodevx/svelte-toast';
	import { Heading } from 'flowbite-svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	const errorReason = form ? form.reason : null;
	const errorType = form ? form.type : null;
	const message = form ? form.message : null;
	const newAuthToken = form ? form.newAuthToken : null;

	if (message) {
		toast.push(message, SUCCESS_TOAST_OPTIONS);
	}

	if (typeof newAuthToken === 'string' && newAuthToken.length > 0) {
		localStorage.setItem(SESSION_ID_KEY, newAuthToken);
	}
</script>

<svelte:head>
	<title>Profile Settings</title>
</svelte:head>

<main>
	<Heading class="p-3 mt-2 text-center">Account Settings</Heading>
	<section class="flex flex-wrap justify-around m-5">
		<ChangeUsernameForm error={errorReason} {errorType} />
		<ChangePasswordForm error={errorReason} {errorType} />
		<ChangeProfilePicture error={errorReason} {errorType} />
		<DeleteAccountForm error={errorReason} {errorType} />
	</section>
</main>
