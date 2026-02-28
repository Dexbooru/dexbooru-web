<script lang="ts">
	import { getAuthenticatedUserNotifications } from '$lib/client/helpers/context';
	import Dropdown from 'flowbite-svelte/Dropdown.svelte';
	import BullhornSolid from 'flowbite-svelte-icons/BullhornSolid.svelte';
	import { onMount } from 'svelte';

	type Props = {
		notificationCount: number;
	};

	let { notificationCount }: Props = $props();

	const userNotifications = getAuthenticatedUserNotifications();
	const userNotificationsUnsubscribe = userNotifications.subscribe((notificationData) => {
		if (!notificationData) return;
	});

	onMount(() => {
		return () => {
			userNotificationsUnsubscribe();
		};
	});
</script>

<Dropdown
	triggeredBy="#notification-bell"
	class="w-full max-w-sm divide-y divide-gray-100 rounded shadow dark:divide-gray-700 dark:bg-gray-800"
>
	<div class="py-2 text-center font-bold">Notifications ({notificationCount})</div>
	{#if notificationCount > 0}{:else}
		<div class="flex-col justify-center space-y-2 p-4 text-center">
			<p>We have nothing for you at the moment!</p>
			<BullhornSolid class="mr-auto ml-auto" />
		</div>
	{/if}
</Dropdown>
