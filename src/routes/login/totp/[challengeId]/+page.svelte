<script lang="ts">
	import TotpForm from '$lib/client/components/auth/TotpForm.svelte';
	import type { ActionData, PageData } from './$types';

	interface Props {
		form: ActionData;
		data: PageData;
	}

	let { form, data }: Props = $props();

	let username: string = $derived(data.challengeData.username);
	let rememberMe: boolean = $derived(data.challengeData.rememberMe);
</script>

<svelte:head>
	<title>2-factor authentication challenge</title>
</svelte:head>

<main class="flex justify-center items-center">
	<TotpForm {form} {rememberMe} {username} />
</main>
