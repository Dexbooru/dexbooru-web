<script lang="ts">
	import { normalizeCount } from '$lib/client/helpers/posts';
	import { notificationStore } from '$lib/client/notifications/notificationStore';
	import Indicator from 'flowbite-svelte/Indicator.svelte';
	import BellSolid from 'flowbite-svelte-icons/BellSolid.svelte';

	const unreadCount = notificationStore.unreadCount;
</script>

<div
	id="notification-bell"
	class="mr-3 inline-flex cursor-pointer items-center text-center text-sm font-medium text-gray-500 hover:text-gray-900 focus:outline-none dark:text-gray-400 dark:hover:text-white"
>
	<BellSolid class="h-5 w-5" />

	<div class="relative flex">
		{#if $unreadCount > 0}
			<div
				class="relative end-2 -top-3 inline-flex h-4 w-4 rounded-full border-2 border-white bg-red-500 text-white dark:border-gray-900"
			>
				<Indicator color="blue" border size="xl" placement="top-right" class="text-xs font-bold"
					>{normalizeCount($unreadCount)}</Indicator
				>
			</div>
		{/if}
	</div>
</div>
