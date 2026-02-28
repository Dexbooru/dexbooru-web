<script lang="ts">
	import { page } from '$app/state';
	import SettingsTabs from '$lib/client/components/auth/SettingsTabs.svelte';
	import { capitalize } from '$lib/shared/helpers/util';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Profile Settings - {capitalize(page.url.searchParams.get('tab') ?? 'Personal')}</title>
</svelte:head>

<main>
	<SettingsTabs
		linkedAccounts={data.linkedAccounts}
		emailVerified={data.emailVerified}
		oauthAuthorizationLinks={{
			discordAuthorizationUrl: data.discordAuthorizationUrl,
			githubAuthorizationUrl: data.githubAuthorizationUrl,
			googleAuthorizationUrl: data.googleAuthorizationUrl,
		}}
	/>
</main>
