<script lang="ts">
	import NotificationListItem from '$lib/client/components/notifications/NotificationListItem.svelte';
	import { notificationStore } from '$lib/client/notifications/notificationStore';
	import BullhornSolid from 'flowbite-svelte-icons/BullhornSolid.svelte';
	import Dropdown from 'flowbite-svelte/Dropdown.svelte';

	const MAX_VISIBLE = 10;

	const notifications = notificationStore.notifications;
	const unreadCount = notificationStore.unreadCount;

	const recentNotifications = $derived($notifications.slice(0, MAX_VISIBLE));
	const hasMore = $derived($notifications.length > MAX_VISIBLE);

	let markingAsRead = $state(false);

	async function handleMarkAllAsRead() {
		markingAsRead = true;
		await notificationStore.markAsRead({ all: true });
		markingAsRead = false;
	}
</script>

<Dropdown
	triggeredBy="#notification-bell"
	class="w-[calc(100vw-1.5rem)] max-w-sm divide-y divide-gray-100 rounded shadow sm:w-full dark:divide-gray-700 dark:bg-gray-800"
>
	<div class="py-2 text-center font-bold dark:text-white">Notifications ({$unreadCount})</div>
	{#if recentNotifications.length > 0}
		<div class="max-h-80 overflow-y-auto">
			{#each recentNotifications as notification (notification._id)}
				<NotificationListItem {notification} />
			{/each}
		</div>
		{#if hasMore}
			<a
				href="/notifications"
				class="block border-t border-gray-100 py-2 text-center text-sm font-medium text-blue-600 hover:bg-gray-100 dark:border-gray-700 dark:text-blue-500 dark:hover:bg-gray-700"
			>
				Show all notifications
			</a>
		{:else if $unreadCount > 0}
			<button
				onclick={handleMarkAllAsRead}
				disabled={markingAsRead}
				class="block w-full border-t border-gray-100 py-2 text-center text-sm font-medium text-blue-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-blue-500 dark:hover:bg-gray-700"
			>
				{markingAsRead ? 'Marking...' : 'Mark all as read'}
			</button>
		{/if}
	{:else}
		<div class="flex-col justify-center space-y-2 p-4 text-center dark:text-white">
			<p>We have nothing for you at the moment!</p>
			<BullhornSolid class="mr-auto ml-auto" />
		</div>
	{/if}
</Dropdown>
