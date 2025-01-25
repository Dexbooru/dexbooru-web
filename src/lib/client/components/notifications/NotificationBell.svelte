<script lang="ts">
	import { normalizeCount } from '$lib/client/helpers/posts';
	import Indicator from 'flowbite-svelte/Indicator.svelte';
	import BellSolid from 'flowbite-svelte-icons/BellSolid.svelte';

	type Props = {
		notificationCount: number;
	};

	let { notificationCount }: Props = $props();
</script>

<div
	id="notification-bell"
	class="cursor-pointer inline-flex mr-3 items-center text-sm font-medium text-center text-gray-500 hover:text-gray-900 focus:outline-none dark:hover:text-white dark:text-gray-400"
>
	<BellSolid class="w-5 h-5kj" />

	<div class="flex relative">
		{#if notificationCount > 0}
			<div
				class="inline-flex relative -top-3 end-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 text-white"
			>
				<Indicator color="blue" border size="xl" placement="top-right" class="text-xs font-bold"
					>{normalizeCount(notificationCount || 0)}</Indicator
				>
			</div>
		{/if}
	</div>
</div>
