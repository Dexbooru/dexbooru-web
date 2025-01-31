<script lang="ts">
	import { addFriend, deleteFriend } from '$lib/client/api/friends';
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUser } from '$lib/client/helpers/context';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TFriendStatus } from '$lib/shared/types/friends';
	import type { TUser, TUserStatistics } from '$lib/shared/types/users';
	import type { LinkedUserAccount } from '@prisma/client';
	import { toast } from '@zerodevx/svelte-toast';
	import DotsHorizontalOutline from 'flowbite-svelte-icons/DotsHorizontalOutline.svelte';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Dropdown from 'flowbite-svelte/Dropdown.svelte';
	import DropdownItem from 'flowbite-svelte/DropdownItem.svelte';
	import OauthIcon from './OauthIcon.svelte';

	type Props = {
		targetUser: TUser;
		friendStatus: TFriendStatus;
		userStatistics: TUserStatistics;
		linkedAccounts: LinkedUserAccount[];
	};

	let { targetUser, friendStatus = $bindable(), userStatistics, linkedAccounts }: Props = $props();

	let addFriendLoading = $state(false);
	let deleteFriendLoading = $state(false);

	const user = getAuthenticatedUser();

	const handleAddFriend = async () => {
		if (!$user || $user.id === targetUser.id) return;

		addFriendLoading = true;
		const response = await addFriend(targetUser.username);
		addFriendLoading = false;

		if (response.ok) {
			toast.push('A friend request was sent to this user!', SUCCESS_TOAST_OPTIONS);
			friendStatus = 'request-pending';
		} else {
			toast.push(
				'An error occured while trying to send a friend request to this user',
				FAILURE_TOAST_OPTIONS,
			);
		}
	};

	const handleDeleteFriend = async () => {
		if (!$user || $user.id === targetUser.id) return;

		deleteFriendLoading = true;
		const response = await deleteFriend(targetUser.username);
		deleteFriendLoading = false;

		if (response.ok) {
			toast.push(`You have successfully unfriended ${targetUser.username}!`, SUCCESS_TOAST_OPTIONS);
			friendStatus = 'not-friends';
		} else {
			toast.push('An error occured while trying to unfriend this user!', FAILURE_TOAST_OPTIONS);
		}
	};

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;

		target.src = DefaultProfilePicture;
	};
</script>

<Card class="mx-4 sm:mx-auto p-4 sm:p-6" style="min-width: 300px; max-width: 550px;">
	<div class="flex justify-end">
		<DotsHorizontalOutline class="hover:cursor-pointer" />
		<Dropdown class="w-36">
			{#if $user && $user.id === targetUser.id}
				<DropdownItem>Export data</DropdownItem>
			{/if}
			<DropdownItem>Report account</DropdownItem>
		</Dropdown>
	</div>
	<div class="flex flex-col items-center pb-4">
		<Avatar size="lg" src={targetUser.profilePictureUrl} onerror={onImageError} />
		<h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">
			{targetUser.username}
		</h5>

		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Account id:
			<strong>{targetUser.id}</strong></span
		>
		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Account creation date:
			<strong>{formatDate(new Date(targetUser.createdAt))}</strong></span
		>
		{#if $user && $user.id === targetUser.id}
			<span class="text-sm text-gray-500 dark:text-gray-400"
				>Account last updated at date:
				<strong>{formatDate(new Date(targetUser.updatedAt))}</strong></span
			>
			<span class="text-sm text-gray-500 dark:text-gray-400"
				>Account email:
				<strong>{targetUser.email.toLocaleLowerCase()}</strong></span
			>
		{/if}
		<hr class="border-0 h-px bg-gray-300 dark:bg-gray-600 my-2" />

		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Total posts:
			<strong>{userStatistics.totalPosts}</strong></span
		>
		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Total views on all posts:
			<strong>{userStatistics.totalViews}</strong></span
		>
		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Average views on all posts:
			<strong>{userStatistics.averageViews}</strong></span
		>
		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Total likes on all posts:
			<strong>{userStatistics.totalLikes}</strong></span
		>
		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Average likes on all posts:
			<strong>{userStatistics.averageViews}</strong></span
		>

		<div class="flex flex-col mt-3 space-y-3">
			{#if $user}
				{#if $user.id !== targetUser.id}
					{#if friendStatus === 'not-friends'}
						<Button disabled={addFriendLoading} on:click={handleAddFriend}>Add friend</Button>
					{:else if friendStatus === 'request-pending'}
						<Button disabled>Friend request pending</Button>
					{:else if friendStatus === 'are-friends'}
						<Button disabled={deleteFriendLoading} href="/chat/{targetUser.username}"
							>Chat with them</Button
						>
						<Button disabled={deleteFriendLoading} on:click={handleDeleteFriend}>Unfriend</Button>
					{/if}

					<Button href="/posts/uploaded/{targetUser.username}" color="blue"
						>View uploaded posts</Button
					>
					<Button href="/collections/user/{targetUser.username}" color="blue"
						>View created collections</Button
					>
				{:else}
					<Button href="/posts/liked" color="red">Liked posts</Button>
					<Button href="/posts/uploaded" color="blue">Uploaded posts</Button>
					<Button href="/collections/created" color="blue">Created collections</Button>
				{/if}
			{/if}
		</div>

		{#if linkedAccounts.length > 0}
			<div class="flex flex-col mt-3 space-y-3">
				<p>Connected social media platforms:</p>
				<div class="flex flex-col space-y-4">
					{#each linkedAccounts as linkedAccount}
						<OauthIcon {linkedAccount} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
</Card>
