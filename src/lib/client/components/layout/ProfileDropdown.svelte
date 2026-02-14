<script lang="ts">
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import {
		getAuthenticatedUser,
		getAuthenticatedUserNotifications,
	} from '$lib/client/helpers/context';
	import { clearPostDraft } from '$lib/client/helpers/drafts';
	import DropdownDivider from 'flowbite-svelte/DropdownDivider.svelte';
	import AngleDownOutline from 'flowbite-svelte-icons/AngleDownOutline.svelte';
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
	<Spinner size="8" class="mt-3 mr-4" />
{/if}

{#if $user}
	<div role="group" class="relative" onmouseenter={() => (dropdownOpen = true)}>
		<Button
			id="navbar-profile-picture"
			class="flex space-x-4 bg-transparent !p-1 text-gray-900 hover:bg-gray-100 focus:ring-0 dark:bg-slate-700 dark:text-white dark:hover:bg-gray-700"
		>
			<Avatar
				onerror={onImageError}
				src={$user.profilePictureUrl ?? DefaultProfilePicture}
				alt="profile of {$user.username}"
				class="hide-alt-text mr-2"
			/>
			{$user.username}
			<AngleDownOutline size="sm" class="!mr-2" />
		</Button>

		<Dropdown simple bind:isOpen={dropdownOpen} class="w-44 list-none bg-white dark:bg-gray-700">
			<DropdownItem href="/profile/{$user?.username}" class="text-gray-900 dark:text-white"
				>Your Profile</DropdownItem
			>
			<DropdownItem href="/posts/uploaded" class="text-gray-900 dark:text-white"
				>Your Posts</DropdownItem
			>
			<DropdownItem href="/collections/created" class="text-gray-900 dark:text-white"
				>Your Collections</DropdownItem
			>
			<DropdownItem href="/comments/created" class="text-gray-900 dark:text-white"
				>Your Comments</DropdownItem
			>
			<DropdownItem href="/friends" class="text-gray-900 dark:text-white">Your Friends</DropdownItem
			>
			<DropdownItem href="/posts/liked" class="text-gray-900 dark:text-white"
				>Liked Posts</DropdownItem
			>
			<DropdownItem href="/profile/settings" class="text-gray-900 dark:text-white"
				>Settings</DropdownItem
			>
			<DropdownDivider />
			<DropdownItem
				href="/profile/logout"
				class="text-gray-900 dark:text-white"
				onclick={clearPostDraft}>Sign out</DropdownItem
			>
		</Dropdown>
	</div>
{/if}
