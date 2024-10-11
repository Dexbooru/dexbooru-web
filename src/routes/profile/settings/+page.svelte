<script lang="ts">
	import SettingsTabs from '$lib/client/components/auth/SettingsTabs.svelte';
	import { SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { SESSION_ID_KEY } from '$lib/shared/constants/session';
	import { toast } from '@zerodevx/svelte-toast';
	import { Heading } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	const message = form ? form.message : null;

	if (message) {
		toast.push(message, SUCCESS_TOAST_OPTIONS);
	}

	onMount(() => {
		const newAuthToken = form ? form.newAuthToken : null;

		if (typeof newAuthToken === 'string' && newAuthToken.length > 0) {
			localStorage.setItem(SESSION_ID_KEY, newAuthToken);
		}
	});
</script>

<svelte:head>
	<title>Profile Settings</title>
</svelte:head>

<main>
	<Heading class="p-3 mt-2 text-center">Account Settings</Heading>
	<SettingsTabs {form} />
</main>
