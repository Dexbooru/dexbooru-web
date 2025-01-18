<script lang="ts">
	import { page } from '$app/state';
	import SettingsTabs from '$lib/client/components/auth/SettingsTabs.svelte';
	import { capitalize } from '$lib/shared/helpers/util';
</script>

<svelte:head>
	<title>Profile Settings - {capitalize(page.url.searchParams.get('tab') ?? '')}</title>
</svelte:head>

<main>
	<SettingsTabs />
</main>
