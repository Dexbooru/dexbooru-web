<script lang="ts">
	import type { LinkedUserAccount } from '$generated/prisma/browser';
	import Card from 'flowbite-svelte/Card.svelte';
	import OauthLinks from './OauthLinks.svelte';

	type Props = {
		linkedAccounts: LinkedUserAccount[];
		googleAuthorizationUrl: string;
		discordAuthorizationUrl: string;
		githubAuthorizationUrl: string;
	};
	let {
		linkedAccounts,
		googleAuthorizationUrl,
		discordAuthorizationUrl,
		githubAuthorizationUrl,
	}: Props = $props();
</script>

<Card class="p-6 sm:p-8">
	<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white mb-5">
		Connect third-party applications
		<br />
		<span class="text-sm">(Connected apps can used to sign into this account)</span>
	</h3>
	<OauthLinks
		{linkedAccounts}
		{googleAuthorizationUrl}
		{discordAuthorizationUrl}
		{githubAuthorizationUrl}
		location="security-settings"
	/>
</Card>
