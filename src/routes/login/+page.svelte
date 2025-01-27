<script lang="ts">
	import ApplicationLogo from '$lib/client/assets/app_logo.webp';
	import LoginForm from '$lib/client/components/auth/LoginForm.svelte';
	import type { ActionData, PageData } from './$types';

	type Props = {
		form: ActionData;
		data: PageData;
	};

	let { form, data }: Props = $props();
</script>

<svelte:head>
	<title>Account Login</title>
	<meta property="og:title" content="Login to Your Dexbooru Account" />
	<meta
		property="og:description"
		content="Access your Dexbooru account to upload, comment, and like posts!"
	/>
	<meta property="og:image" content={ApplicationLogo} />
</svelte:head>

<main class="flex justify-center items-center">
	<LoginForm
		{form}
		googleAuthorizationUrl={data.googleAuthorizationUrl}
		discordAuthorizationUrl={data.discordAuthorizationUrl}
		githubAuthorizationUrl={data.githubAuthorizationUrl}
	/>
</main>
