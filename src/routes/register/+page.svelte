<script lang="ts">
	import { page } from '$app/stores';
	import RegisterForm from '$lib/client/components/auth/RegisterForm.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Account Registration</title>
	<meta property="og:title" content="Create Your Dexbooru Account" />
	<meta
		property="og:description"
		content="Join Dexbooru to upload, comment, and like posts. Become a part of our growing community!"
	/>
	<meta property="og:image" content={`${$page.url.href}/favicon.png`} />
</svelte:head>

<main class="flex justify-center items-center">
	<RegisterForm {form} />
</main>
