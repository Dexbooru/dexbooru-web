<script lang="ts">
	import ApplicationLogo from '$lib/client/assets/app_logo.webp';
	import ForgotPasswordForm from '$lib/client/components/auth/ForgotPasswordForm.svelte';
</script>

<svelte:head>
	<title>Account Recovery</title>
	<meta property="og:title" content="Account Recovery" />
	<meta property="og:description" content="Recover your account by resetting your password." />
	<meta property="og:image" content={ApplicationLogo} />
</svelte:head>

<main class="flex items-center justify-center">
	<ForgotPasswordForm />
</main>
