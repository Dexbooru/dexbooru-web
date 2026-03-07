<script lang="ts">
	import { notificationStore } from '$lib/client/notifications/notificationStore';
	import {
		getActorAvatar,
		getActorUsername,
		getNotificationMessage,
		getNotificationLink,
		getTypeLabel,
		getTypeBadgeColor,
		onAvatarError,
	} from '$lib/client/notifications/notificationHelpers';
	import type { TRealtimeNotification, TNotificationType } from '$lib/shared/types/notifcations';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import BullhornSolid from 'flowbite-svelte-icons/BullhornSolid.svelte';
	import CheckCircleSolid from 'flowbite-svelte-icons/CheckCircleSolid.svelte';
	import ArrowLeftOutline from 'flowbite-svelte-icons/ArrowLeftOutline.svelte';
	import ArrowRightOutline from 'flowbite-svelte-icons/ArrowRightOutline.svelte';

	const ITEMS_PER_PAGE = 20;

	let currentPage = $state(1);
	let activeFilter = $state<'all' | 'unread'>('all');
	let pageNotifications = $state<TRealtimeNotification[]>([]);
	let loading = $state(false);
	let markingAll = $state(false);

	const unreadCount = notificationStore.unreadCount;

	let hasNextPage = $derived(pageNotifications.length === ITEMS_PER_PAGE);
	let hasPrevPage = $derived(currentPage > 1);

	async function loadPage(page: number) {
		loading = true;
		const read = activeFilter === 'unread' ? false : undefined;
		pageNotifications = await notificationStore.fetchPaginatedNotifications(
			page,
			ITEMS_PER_PAGE,
			read,
		);
		currentPage = page;
		loading = false;
	}

	async function handleFilterChange(filter: 'all' | 'unread') {
		activeFilter = filter;
		await loadPage(1);
	}

	async function handleMarkAllAsRead() {
		markingAll = true;
		const success = await notificationStore.markAsRead({ all: true });
		if (success) {
			pageNotifications = pageNotifications.map((n) => ({ ...n, wasRead: true }));
		}
		markingAll = false;
	}

	async function handleMarkSingleAsRead(notification: TRealtimeNotification) {
		if (notification.wasRead) return;

		const idsByType: Record<TNotificationType, string> = {
			new_post_like: 'newPostLikeIds',
			new_post_comment: 'newPostCommentIds',
			friend_invite: 'friendInviteIds',
		};

		const key = idsByType[notification.type];
		const success = await notificationStore.markAsRead({
			notificationIds: { [key]: [notification._id] },
		});

		if (success) {
			pageNotifications = pageNotifications.map((n) =>
				n._id === notification._id ? { ...n, wasRead: true } : n,
			);
		}
	}

	$effect(() => {
		loadPage(1);
	});
</script>

<svelte:head>
	<title>Notifications | Dexbooru</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
			Notifications
			{#if $unreadCount > 0}
				<span
					class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
				>
					{$unreadCount} unread
				</span>
			{/if}
		</h1>

		<div class="flex items-center gap-2">
			<Button
				size="sm"
				color={activeFilter === 'all' ? 'blue' : 'alternative'}
				onclick={() => handleFilterChange('all')}
			>
				All
			</Button>
			<Button
				size="sm"
				color={activeFilter === 'unread' ? 'blue' : 'alternative'}
				onclick={() => handleFilterChange('unread')}
			>
				Unread
			</Button>

			{#if $unreadCount > 0}
				<Button size="sm" color="light" onclick={handleMarkAllAsRead} disabled={markingAll}>
					<CheckCircleSolid class="mr-1 h-4 w-4" />
					{markingAll ? 'Marking...' : 'Mark all read'}
				</Button>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-16">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
		</div>
	{:else if pageNotifications.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-lg border border-gray-200 py-16 dark:border-gray-700"
		>
			<BullhornSolid class="mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
			<p class="text-lg font-medium text-gray-500 dark:text-gray-400">
				{activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
			</p>
			<p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
				{activeFilter === 'unread'
					? "You're all caught up!"
					: "When you get notifications, they'll show up here."}
			</p>
		</div>
	{:else}
		<div
			class="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700"
		>
			{#each pageNotifications as notification (notification._id)}
				{@const link = getNotificationLink(notification)}
				<div
					class="relative flex items-start gap-3 px-4 py-4 transition-colors sm:items-center sm:gap-4 sm:px-6"
					class:bg-blue-50={!notification.wasRead}
					class:dark:bg-gray-800={!notification.wasRead}
					class:bg-white={notification.wasRead}
					class:dark:bg-gray-900={notification.wasRead}
				>
					<a href={link} class="shrink-0">
						<Avatar
							src={getActorAvatar(notification)}
							alt={getActorUsername(notification)}
							size="md"
							onerror={onAvatarError}
						/>
					</a>

					<div class="min-w-0 flex-1">
						<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
							<a href={link} class="min-w-0 flex-1">
								<p class="text-sm text-gray-900 dark:text-white">
									<span class="font-semibold">{getActorUsername(notification)}</span>
									{getNotificationMessage(notification)}
								</p>
								{#if notification.type === 'new_post_comment' && notification.commentContent}
									<p class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
										"{notification.commentContent}"
									</p>
								{/if}
							</a>

							<div class="flex shrink-0 items-center gap-2">
								<span
									class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {getTypeBadgeColor(
										notification,
									)}"
								>
									{getTypeLabel(notification)}
								</span>
							</div>
						</div>
					</div>

					<div class="flex shrink-0 items-center gap-2">
						{#if !notification.wasRead}
							<button
								type="button"
								class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
								title="Mark as read"
								onclick={() => handleMarkSingleAsRead(notification)}
							>
								<CheckCircleSolid class="h-5 w-5" />
							</button>
						{:else}
							<span class="p-1.5 text-green-500" title="Read">
								<CheckCircleSolid class="h-5 w-5" />
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-6 flex items-center justify-center gap-3">
			{#if hasPrevPage}
				<Button size="sm" color="alternative" onclick={() => loadPage(currentPage - 1)}>
					<ArrowLeftOutline class="mr-2 h-4 w-4" />
					Previous
				</Button>
			{/if}

			<span class="text-sm text-gray-500 dark:text-gray-400">
				Page {currentPage}
			</span>

			{#if hasNextPage}
				<Button size="sm" color="alternative" onclick={() => loadPage(currentPage + 1)}>
					Next
					<ArrowRightOutline class="ml-2 h-4 w-4" />
				</Button>
			{/if}
		</div>
	{/if}
</div>
