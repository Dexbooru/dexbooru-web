<script lang="ts">
	import type { LinkedUserAccount } from '$generated/prisma/browser';
	import { capitalize } from '$lib/shared/helpers/util';
	import DiscordSolid from 'flowbite-svelte-icons/DiscordSolid.svelte';
	import GithubSolid from 'flowbite-svelte-icons/GithubSolid.svelte';
	import GoogleSolid from 'flowbite-svelte-icons/GoogleSolid.svelte';

	type Props = {
		linkedAccount: LinkedUserAccount;
	};

	let { linkedAccount }: Props = $props();
</script>

<div
	class="flex justify-center space-x-3 rounded-lg border border-gray-300 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-gray-600"
>
	{#if linkedAccount.platform === 'DISCORD'}
		<DiscordSolid class="h-8 w-8 text-blue-600 dark:text-blue-400" />
	{:else if linkedAccount.platform === 'GITHUB'}
		<GithubSolid class="h-8 w-8 text-gray-800 dark:text-gray-200" />
	{:else if linkedAccount.platform === 'GOOGLE'}
		<GoogleSolid class="h-8 w-8 text-red-600 dark:text-red-400" />
	{/if}

	<span class="text-md mt-1 font-medium text-gray-500 dark:text-gray-400">
		{capitalize(linkedAccount.platform)}: {linkedAccount.platformUsername}
	</span>
</div>
