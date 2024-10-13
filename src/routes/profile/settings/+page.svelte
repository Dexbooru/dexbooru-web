<script lang="ts">
	import SettingsTabs from '$lib/client/components/auth/SettingsTabs.svelte';
	import { Heading } from 'flowbite-svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Profile Settings</title>
</svelte:head>

<main>
	<Heading class="p-3 mt-2 text-center">Account Settings</Heading>
	<SettingsTabs {form} />
</main>
