<script lang="ts">
	import { page } from '$app/stores';
	import LoginForm from '$lib/client/components/auth/LoginForm.svelte';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();
</script>

<svelte:head>
	<title>Account Login</title>
	<meta property="og:title" content="Login to Your Dexbooru Account" />
	<meta
		property="og:description"
		content="Access your Dexbooru account to upload, comment, and like posts!"
	/>
	<meta property="og:image" content={`${$page.url.href}/favicon.png`} />
</svelte:head>

<main class="flex justify-center items-center">
	<LoginForm {form} />
</main>
