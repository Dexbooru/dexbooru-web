<script lang="ts">
	import {
		buildMarkSingleAsReadRequest,
		getActorAvatar,
		getActorUsername,
		getCommentNotificationPreview,
		getNotificationLink,
		getNotificationMessage,
		getPostImageUrl,
		onAvatarError,
		onPostImageError,
	} from '$lib/client/notifications/notificationHelpers';
	import { notificationStore } from '$lib/client/notifications/notificationStore';
	import type { TRealtimeNotification } from '$lib/shared/types/notifcations';
	import CheckCircleSolid from 'flowbite-svelte-icons/CheckCircleSolid.svelte';
	import Avatar from 'flowbite-svelte/Avatar.svelte';

	type Props = {
		notification: TRealtimeNotification;
	};

	let { notification }: Props = $props();

	let markingAsRead = $state(false);
	const postImageUrl = $derived(getPostImageUrl(notification));

	async function handleMarkAsRead(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (notification.wasRead || markingAsRead) return;

		markingAsRead = true;
		await notificationStore.markAsRead(buildMarkSingleAsReadRequest(notification));
		markingAsRead = false;
	}
</script>

<div
	class="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
	class:opacity-60={notification.wasRead}
>
	<a href={getNotificationLink(notification)} class="flex min-w-0 flex-1 items-center gap-3">
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
					"{getCommentNotificationPreview(notification.commentContent)}"
				</p>
			{/if}
		</div>
		{#if postImageUrl}
			<img
				src={postImageUrl}
				alt="Post preview"
				class="h-10 w-10 shrink-0 rounded object-cover"
				onerror={onPostImageError}
			/>
		{/if}
	</a>

	{#if !notification.wasRead}
		<button
			type="button"
			class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-600 dark:hover:text-gray-200"
			title="Mark as read"
			aria-label="Mark notification as read"
			disabled={markingAsRead}
			onclick={handleMarkAsRead}
		>
			<CheckCircleSolid class="h-4 w-4" />
		</button>
	{:else}
		<span class="shrink-0 p-1.5 text-green-500" title="Read">
			<CheckCircleSolid class="h-4 w-4" />
		</span>
	{/if}
</div>
