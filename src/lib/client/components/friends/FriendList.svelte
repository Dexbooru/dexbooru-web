<script lang="ts">
	import { handleFriendRequest } from '$lib/client/api/friends';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getFriendData } from '$lib/client/helpers/context';
	import { chatStore } from '$lib/client/stores/chat';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TChatFriend, TFriendRequestAction } from '$lib/shared/types/friends';
	import { toast } from '@zerodevx/svelte-toast';
	import { Avatar, Button } from 'flowbite-svelte';

	type Props = {
		listType: 'friend' | 'sent-request' | 'received-request';
	};

	let { listType }: Props = $props();

	let friendshipActionLoading = $state(false);

	const friendData = getFriendData();

	const handleFriendshipAction = async (
		action: TFriendRequestAction,
		friendRequest: TChatFriend,
	) => {
		friendshipActionLoading = true;
		const response = await handleFriendRequest(friendRequest.username, {
			action,
		});
		friendshipActionLoading = false;

		if (response.ok) {
			const toastMessage =
				action === 'accept'
					? `You are now friends with ${friendRequest.username}!`
					: 'You rejected the friend request successfully!';
			toast.push(toastMessage, SUCCESS_TOAST_OPTIONS);

			if (action === 'accept') {
				friendData.update((currentFriendData) => {
					if (!currentFriendData) return null;

					currentFriendData.friends.push({
						id: friendRequest.id,
						username: friendRequest.username,
						profilePictureUrl: friendRequest.profilePictureUrl,
					});
					currentFriendData.receivedFriendRequests =
						currentFriendData.receivedFriendRequests.filter(
							(request) => request.id !== friendRequest.id,
						);
					currentFriendData.sentFriendRequests = currentFriendData.sentFriendRequests.filter(
						(request) => request.id !== friendRequest.id,
					);

					return currentFriendData;
				});

				chatStore.update((currentChatData) => {
					currentChatData.friends.push({
						id: friendRequest.id,
						username: friendRequest.username,
						profilePictureUrl: friendRequest.profilePictureUrl,
					});

					return currentChatData;
				});
			}
		} else {
			toast.push(
				'An error occured while trying to accept the friend request!',
				FAILURE_TOAST_OPTIONS,
			);

			friendData.update((currentFriendData) => {
				if (!currentFriendData) return null;

				currentFriendData.receivedFriendRequests = currentFriendData.receivedFriendRequests.filter(
					(request) => request.id !== friendRequest.id,
				);

				return currentFriendData;
			});
		}
	};
</script>

{#if $friendData}
	<ul class="divide-y divide-gray-200 dark:divide-gray-700">
		{#each listType === 'friend' ? $friendData.friends : listType === 'sent-request' ? $friendData.sentFriendRequests : listType === 'received-request' ? $friendData.receivedFriendRequests : [] as currentFriend}
			<li class="p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
				<div class="flex items-center justify-between space-x-4">
					<div class="flex items-center space-x-4">
						<div class="flex-shrink-0">
							<Avatar
								src={currentFriend.profilePictureUrl}
								alt={`${currentFriend.username}'s profile`}
								class="w-10 h-10"
							/>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
								{currentFriend.username}
							</p>
							{#if listType === 'friend'}
								<p class="text-sm text-gray-500 dark:text-gray-400 truncate">
									ID: {currentFriend.id}
								</p>
							{:else}
								<p class="text-sm text-gray-500 dark:text-gray-400 truncate">
									Sent at: {formatDate((currentFriend as TChatFriend & { sentAt: Date }).sentAt)}
								</p>
							{/if}
						</div>
					</div>
					<div class="flex space-x-3">
						<Button href="/profile/{currentFriend.username}">View Profile</Button>
						{#if listType === 'received-request'}
							<Button
								color="green"
								disabled={friendshipActionLoading}
								on:click={() => handleFriendshipAction('accept', currentFriend)}>Accept</Button
							>
							<Button
								color="red"
								disabled={friendshipActionLoading}
								on:click={() => handleFriendshipAction('decline', currentFriend)}>Reject</Button
							>
						{/if}
					</div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
