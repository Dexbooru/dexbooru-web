<script lang="ts">
	import { page } from '$app/state';
	import ApplicationLogo from '$lib/client/assets/app_logo.webp';
	import RegisterForm from '$lib/client/components/auth/RegisterForm.svelte';
	import type { ActionData } from './$types';

	type Props = {
		form: ActionData;
	};

	let { form }: Props = $props();
</script>

<svelte:head>
	<title>Account Registration</title>
	<meta property="og:title" content="Create Your Dexbooru Account" />
	<meta
		property="og:description"
		content="Join Dexbooru to upload, comment, and like posts. Become a part of our growing community!"
	/>
	<meta property="og:image" content={`${page.url.href}/${ApplicationLogo}`} />
</svelte:head>

<main class="flex justify-center items-center">
	<RegisterForm {form} />
</main>
