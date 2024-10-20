<script lang="ts">
	import { handleFriendRequest } from '$lib/client/api/friends';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUserNotifications } from '$lib/client/helpers/context';
	import { chatStore } from '$lib/client/stores/chat';
	import { getTimeDifferenceString } from '$lib/shared/helpers/dates';
	import type { TFriendRequest, TFriendRequestAction } from '$lib/shared/types/friends';
	import { toast } from '@zerodevx/svelte-toast';
	import { Avatar, Button, DropdownItem } from 'flowbite-svelte';

	export let friendRequest: TFriendRequest;

	let friendshipActionLoading = false;

	const userNotifications = getAuthenticatedUserNotifications();

	const handleFriendshipAction = async (action: TFriendRequestAction) => {
		friendshipActionLoading = true;
		const response = await handleFriendRequest(friendRequest.senderUser.username, {
			action,
		});
		friendshipActionLoading = false;

		if (response.ok) {
			const toastMessage =
				action === 'accept'
					? `You are now friends with ${friendRequest.senderUser.username}!`
					: 'You rejected the friend request successfully!';
			toast.push(toastMessage, SUCCESS_TOAST_OPTIONS);

			userNotifications.update((currentNotificationData) => {
				if (!currentNotificationData) return null;

				currentNotificationData.friendRequests = currentNotificationData.friendRequests.filter(
					(currentFriendRequest) => currentFriendRequest.id !== friendRequest.id,
				);

				return currentNotificationData;
			});

			if (action === 'accept') {
				chatStore.update((currentChatData) => {
					currentChatData.friends.push({
						id: friendRequest.senderUser.id,
						username: friendRequest.senderUser.username,
						profilePictureUrl: friendRequest.senderUser.profilePictureUrl,
					});

					return currentChatData;
				});
			}
		} else {
			toast.push(
				'An error occured while trying to accept the friend request!',
				FAILURE_TOAST_OPTIONS,
			);
		}
	};
</script>

<DropdownItem class="flex space-x-4 rtl:space-x-reverse cursor-auto hover:bg-inherit">
	<Avatar class="mt-6 booru-avatar" src={friendRequest.senderUser.profilePictureUrl} rounded />
	<div class="ps-3 w-full">
		<div class="text-gray-500 text-sm mb-1.5 dark:text-gray-400">
			New friend request from <a
				href="/profile/{friendRequest.senderUser.username}"
				class="font-semibold text-gray-900 dark:text-white">{friendRequest.senderUser.username}</a
			>
		</div>
		<div class="mt-2 mb-2 flex space-x-3">
			<Button
				disabled={friendshipActionLoading}
				on:click={() => handleFriendshipAction('accept')}
				color="green">Accept</Button
			>
			<Button
				disabled={friendshipActionLoading}
				on:click={() => handleFriendshipAction('decline')}
				color="red">Decline</Button
			>
		</div>
		<div class="text-xs text-primary-600 dark:text-primary-500">
			Sent {getTimeDifferenceString(new Date(friendRequest.sentAt))}
		</div>
	</div>
</DropdownItem>
