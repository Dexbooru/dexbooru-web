<script lang="ts">
	import { notificationStore } from '$lib/client/stores/notifications';
	import type { IFriendRequest } from '$lib/shared/types/friends';
	import { Dropdown } from 'flowbite-svelte';
	import { BullhornSolid } from 'flowbite-svelte-icons';
	import FriendRequest from './FriendRequest.svelte';

	export let notificationCount: number;

	let friendRequests: IFriendRequest[] = [];

	notificationStore.subscribe((notificationData) => {
		if (!notificationData) return;

		friendRequests = notificationData.friendRequests;
	});
</script>

<Dropdown
	triggeredBy="#notification-bell"
	class="w-full max-w-sm rounded divide-y divide-gray-100 shadow dark:bg-gray-800 dark:divide-gray-700"
>
	<div slot="header" class="text-center py-2 font-bold">Notifications ({notificationCount})</div>
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
