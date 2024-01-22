<script lang="ts">
	import ChangePasswordForm from '$lib/client/components/auth/ChangePasswordForm.svelte';
	import ChangeUsernameForm from '$lib/client/components/auth/ChangeUsernameForm.svelte';
	import DeleteAccountForm from '$lib/client/components/auth/DeleteAccountForm.svelte';
	import { Heading } from 'flowbite-svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	const errorReason = form ? form.reason : null;
	const errorType = form ? form.type : null;
</script>

<svelte:head>
	<title>Profile Settings</title>
</svelte:head>

<main>
	<Heading class="p-3">Account Settings</Heading>
	<section class="flex m-4 flex-col space-y-4">
		<ChangeUsernameForm error={errorReason} {errorType} />
		<ChangePasswordForm error={errorReason} {errorType} />
		<DeleteAccountForm error={errorReason} {errorType} />
	</section>
</main>
