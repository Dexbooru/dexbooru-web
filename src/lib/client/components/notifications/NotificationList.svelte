<script lang="ts">
	import { getAuthenticatedUserNotifications } from '$lib/client/helpers/context';
	import type { TFriendRequest } from '$lib/shared/types/friends';
	import { Dropdown } from 'flowbite-svelte';
	import { BullhornSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import FriendRequest from './FriendRequest.svelte';

	interface Props {
		notificationCount: number;
	}

	let { notificationCount }: Props = $props();

	let friendRequests: TFriendRequest[] = $state([]);

	const userNotifications = getAuthenticatedUserNotifications();
	const userNotificationsUnsubscribe = userNotifications.subscribe((notificationData) => {
		if (!notificationData) return;

		friendRequests = notificationData.friendRequests;
	});

	onMount(() => {
		return () => {
			userNotificationsUnsubscribe();
		};
	});
</script>

<Dropdown
	triggeredBy="#notification-bell"
	class="w-full max-w-sm rounded divide-y divide-gray-100 shadow dark:bg-gray-800 dark:divide-gray-700"
>
	{#snippet header()}
		<div class="text-center py-2 font-bold">Notifications ({notificationCount})</div>
	{/snippet}
	{#if notificationCount > 0}
		{#each friendRequests as friendRequest (friendRequest)}
			<FriendRequest {friendRequest} />
		{/each}
	{:else}
		<div class="p-4 text-center space-y-2 flex-col justify-center">
			<p>We have nothing for you at the moment!</p>
			<BullhornSolid class="ml-auto mr-auto" />
		</div>
	{/if}
</Dropdown>
