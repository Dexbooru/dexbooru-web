<script lang="ts">
	import RecoverAccountForm from '$lib/client/components/auth/RecoverAccountForm.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Password Recovery for {data.recoveryAttempt.user.username}</title>
</svelte:head>

<main class="flex justify-center items-center">
	<RecoverAccountForm passwordRecoveryAttempt={data.recoveryAttempt} />
</main>
