<script lang="ts">
	import ForgotPasswordForm from '$lib/client/components/auth/ForgotPasswordForm.svelte';
	import type { ActionData } from './$types';

	type Props = {
		form: ActionData;
	};

	let { form }: Props = $props();

	const errorReason = form ? form.reason : null;
</script>

<svelte:head>
	<title>Account Recovery</title>
</svelte:head>

<main class="flex justify-center items-center">
	<ForgotPasswordForm error={errorReason} />
</main>
