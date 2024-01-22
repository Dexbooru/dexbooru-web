<script lang="ts">
	import RegisterForm from '$lib/client/components/auth/RegisterForm.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Account Registration</title>
</svelte:head>

<main class="flex justify-center items-center">
	<RegisterForm {form} />
</main>
