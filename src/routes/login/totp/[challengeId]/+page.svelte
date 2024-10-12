<script lang="ts">
	import TotpForm from '$lib/client/components/auth/TotpForm.svelte';
	import type { ActionData, PageData } from './$types';

	export let form: ActionData;
	export let data: PageData;

	let username: string;
	let rememberMe: boolean;

	$: {
		username = data.challengeData.username;
		rememberMe = data.challengeData.rememberMe;
	}
</script>

<svelte:head>
	<title>2-factor authentication challenge</title>
</svelte:head>

<main class="flex justify-center items-center">
	<TotpForm {form} {rememberMe} {username} />
</main>
