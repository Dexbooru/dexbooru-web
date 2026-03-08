<script lang="ts">
	import { notificationStore } from '$lib/client/notifications/notificationStore';
	import {
		getActorAvatar,
		getActorUsername,
		getNotificationMessage,
		getNotificationLink,
		onAvatarError,
	} from '$lib/client/notifications/notificationHelpers';
	import { convert as htmlToText } from 'html-to-text';
	import Dropdown from 'flowbite-svelte/Dropdown.svelte';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import BullhornSolid from 'flowbite-svelte-icons/BullhornSolid.svelte';

	const MAX_VISIBLE = 10;

	function stripCommentPreview(html: string): string {
		try {
			return htmlToText(html, { wordwrap: false }).slice(0, 120);
		} catch {
			return html.replace(/<[^>]*>/g, '').slice(0, 120);
		}
	}

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
	class="w-full max-w-sm divide-y divide-gray-100 rounded shadow dark:divide-gray-700 dark:bg-gray-800"
>
	<div class="py-2 text-center font-bold dark:text-white">Notifications ({$unreadCount})</div>
	{#if recentNotifications.length > 0}
		<div class="max-h-80 overflow-y-auto">
			{#each recentNotifications as notification (notification._id)}
				{@const link = getNotificationLink(notification)}
				<a
					href={link}
					class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
					class:opacity-60={notification.wasRead}
				>
					<Avatar
						src={getActorAvatar(notification)}
						alt={getActorUsername(notification)}
						size="sm"
						class="shrink-0"
						onerror={onAvatarError}
					/>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm text-gray-900 dark:text-white">
							<span class="font-semibold">{getActorUsername(notification)}</span>
							{getNotificationMessage(notification)}
						</p>
						{#if notification.type === 'new_post_comment' && notification.commentContent}
							<p class="truncate text-xs text-gray-500 dark:text-gray-400">
								"{stripCommentPreview(notification.commentContent)}"
							</p>
						{/if}
					</div>
					{#if !notification.wasRead}
						<span class="h-2 w-2 shrink-0 rounded-full bg-blue-500"></span>
					{/if}
				</a>
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
				{markingAsRead ? 'Marking...' : 'Mark as read'}
			</button>
		{/if}
	{:else}
		<div class="flex-col justify-center space-y-2 p-4 text-center dark:text-white">
			<p>We have nothing for you at the moment!</p>
			<BullhornSolid class="mr-auto ml-auto" />
		</div>
	{/if}
</Dropdown>
