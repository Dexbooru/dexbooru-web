<script lang="ts">
	import { capitalize } from '$lib/shared/helpers/util';
	import type { LinkedUserAccount } from '@prisma/client';
	import DiscordSolid from 'flowbite-svelte-icons/DiscordSolid.svelte';
	import GithubSolid from 'flowbite-svelte-icons/GithubSolid.svelte';
	import GoogleSolid from 'flowbite-svelte-icons/GoogleSolid.svelte';

	type Props = {
		linkedAccount: LinkedUserAccount;
	};

	let { linkedAccount }: Props = $props();
</script>

<div
	class="p-2 flex justify-center space-x-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow border-gray-300 dark:border-gray-600"
>
	{#if linkedAccount.platform === 'DISCORD'}
		<DiscordSolid class="w-8 h-8 text-blue-600 dark:text-blue-400" />
	{:else if linkedAccount.platform === 'GITHUB'}
		<GithubSolid class="w-8 h-8 text-gray-800 dark:text-gray-200" />
	{:else if linkedAccount.platform === 'GOOGLE'}
		<GoogleSolid class="w-8 h-8 text-red-600 dark:text-red-400" />
	{/if}

	<span class="text-md font-medium mt-1">
		{capitalize(linkedAccount.platform)}: {linkedAccount.platformUsername}
	</span>
</div>
