<script lang="ts">
	import {
		getAuthenticatedUser,
		getAuthenticatedUserNotifications,
	} from '$lib/client/helpers/context';
	import { applyLazyLoadingOnImageClass } from '$lib/client/helpers/dom';
	import { Avatar, Button, Dropdown, DropdownItem, Spinner } from 'flowbite-svelte';
	import { AngleDownSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import NotificationBell from '../notifications/NotificationBell.svelte';
	import NotificationList from '../notifications/NotificationList.svelte';

	let notificationCount: number = $state(0);

	const user = getAuthenticatedUser();
	const notifications = getAuthenticatedUserNotifications();

	const notificationUnsubscribe = notifications.subscribe((currentNotificationData) => {
		if (!currentNotificationData) return;

		notificationCount = Object.values(currentNotificationData)
			.map((notificationSection: unknown[]) => {
				return notificationSection.length;
			})
			.reduce((prev, cur) => prev + cur, 0);
	});

	onMount(() => {
		applyLazyLoadingOnImageClass('booru-avatar-navbar');

		return () => {
			notificationUnsubscribe();
		};
	});
</script>

{#if $notifications}
	<NotificationBell {notificationCount} />
	<NotificationList {notificationCount} />
{:else}
	<Spinner size="7" class="mt-3 mr-4" />
{/if}

<Button color="light" id="navbar-profile-picture" class="!p-1 flex space-x-4">
	<Avatar
		src={$user?.profilePictureUrl}
		alt="profile picture of {$user?.username}"
		class="mr-2 booru-avatar-navbar hide-alt-text"
	/>
	{$user?.username}
	<AngleDownSolid size="sm" class="!mr-2" />
</Button>
<Dropdown triggeredBy="#navbar-profile-picture">
	<DropdownItem href="/profile/{$user?.username}">Your Profile</DropdownItem>
	<DropdownItem href="/posts/uploaded">Your Posts</DropdownItem>
	<DropdownItem href="/collections/created">Your Collections</DropdownItem>
	<DropdownItem href="/posts/liked">Liked Posts</DropdownItem>
	<DropdownItem href="/profile/settings">Settings</DropdownItem>
	{#snippet footer()}
		<DropdownItem href="/profile/logout">Sign out</DropdownItem>
	{/snippet}
</Dropdown>
