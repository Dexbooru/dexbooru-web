<script lang="ts">
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import {
		getAuthenticatedUser,
		getAuthenticatedUserNotifications,
	} from '$lib/client/helpers/context';
	import AngleDownSolid from 'flowbite-svelte-icons/AngleDownSolid.svelte';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Dropdown from 'flowbite-svelte/Dropdown.svelte';
	import DropdownItem from 'flowbite-svelte/DropdownItem.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import NotificationBell from '../notifications/NotificationBell.svelte';
	import NotificationList from '../notifications/NotificationList.svelte';

	let notificationCount: number = $state(0);
	let dropdownOpen: boolean = $state(false);

	const user = getAuthenticatedUser();
	const notifications = getAuthenticatedUserNotifications();

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;
		target.src = DefaultProfilePicture;
	};
</script>

{#if $notifications}
	<NotificationBell {notificationCount} />
	<NotificationList {notificationCount} />
{:else}
	<Spinner size="7" class="mt-3 mr-4" />
{/if}

{#if $user}
	<Button color="light" id="navbar-profile-picture" class="!p-1 flex space-x-4">
		<Avatar
			onerror={onImageError}
			src={$user.profilePictureUrl ?? DefaultProfilePicture}
			alt="profile of {$user.username}"
			class="mr-2 hide-alt-text"
		/>
		{$user.username}
		<AngleDownSolid size="sm" class="!mr-2" />
	</Button>

	<Dropdown bind:open={dropdownOpen}>
		<DropdownItem href="/profile/{$user?.username}">Your Profile</DropdownItem>
		<DropdownItem href="/posts/uploaded">Your Posts</DropdownItem>
		<DropdownItem href="/collections/created">Your Collections</DropdownItem>
		<DropdownItem href="/comments/created">Your Comments</DropdownItem>
		<DropdownItem href="/friends">Your Friends</DropdownItem>
		<DropdownItem href="/posts/liked">Liked Posts</DropdownItem>
		<DropdownItem href="/profile/settings">Settings</DropdownItem>
		{#snippet footer()}
			<DropdownItem href="/profile/logout">Sign out</DropdownItem>
		{/snippet}
	</Dropdown>
{/if}
