<script lang="ts">
	import { notificationStore } from '$lib/client/stores/notifications';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import { Avatar, Button, Dropdown, DropdownItem, Spinner } from 'flowbite-svelte';
	import { AngleDownSolid } from 'flowbite-svelte-icons';
	import { onDestroy } from 'svelte';
	import NotificationBell from '../notifications/NotificationBell.svelte';
	import NotificationList from '../notifications/NotificationList.svelte';

	let notificationCount: number;

	const notificationUnsubscribe = notificationStore.subscribe((currentNotificationData) => {
		if (!currentNotificationData) return;

		notificationCount = Object.values(currentNotificationData)
			.map((notificationSection: unknown[]) => {
				return notificationSection.length;
			})
			.reduce((prev, cur) => prev + cur, 0);
	});

	onDestroy(() => {
		notificationUnsubscribe();
	});
</script>

{#if $notificationStore}
	<NotificationBell {notificationCount} />
	<NotificationList {notificationCount} />
{:else}
	<Spinner size="7" class="mt-3 mr-4" />
{/if}

<Button color="light" id="navbar-profile-picture" class="!p-1 flex space-x-4">
	<Avatar
		src={$authenticatedUserStore?.profilePictureUrl}
		alt="profile picture of {$authenticatedUserStore?.username}"
		class="mr-2"
	/>
	{$authenticatedUserStore?.username}
	<AngleDownSolid size="sm" class="!mr-2" />
</Button>
<Dropdown triggeredBy="#navbar-profile-picture">
	<div slot="header" class="px-4 py-2">
		<span class="block text-sm text-gray-900 dark:text-white"
			>{$authenticatedUserStore?.username}</span
		>
		<span class="block truncate text-sm font-medium">{$authenticatedUserStore?.email}</span>
	</div>
	<DropdownItem href="/profile/{$authenticatedUserStore?.username}">Your Profile</DropdownItem>
	<DropdownItem href="/profile/posts/uploaded">Your Posts</DropdownItem>
	<DropdownItem href="/profile/posts/liked">Liked Posts</DropdownItem>
	<DropdownItem href="/profile/settings">Settings</DropdownItem>
	<DropdownItem href="/profile/logout" slot="footer">Sign out</DropdownItem>
</Dropdown>
