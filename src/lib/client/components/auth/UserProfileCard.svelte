<script lang="ts">
	import { addFriend, deleteFriend } from '$lib/client/api/friends';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TFriendStatus } from '$lib/shared/types/friends';
	import type { IUser, TUserStatistics } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import { Avatar, Button, Card, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { DotsHorizontalOutline } from 'flowbite-svelte-icons';

	export let targetUser: IUser;
	export let friendStatus: TFriendStatus;
	export let userStatistics: TUserStatistics;

	let addFriendLoading = false;
	let deleteFriendLoading = false;

	const handleAddFriend = async () => {
		if (!$authenticatedUserStore || $authenticatedUserStore.id === targetUser.id) return;

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
		if (!$authenticatedUserStore || $authenticatedUserStore.id === targetUser.id) return;

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
</script>

<Card style="min-width: 300px; max-width: 550px;">
	<div class="flex justify-end">
		<DotsHorizontalOutline class="hover:cursor-pointer" />
		<Dropdown class="w-36">
			{#if $authenticatedUserStore && $authenticatedUserStore.id === targetUser.id}
				<DropdownItem>Export data</DropdownItem>
			{/if}
			<DropdownItem>Report account</DropdownItem>
		</Dropdown>
	</div>
	<div class="flex flex-col items-center pb-4">
		<Avatar size="lg" class="booru-avatar" src={targetUser.profilePictureUrl} />
		<h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">{targetUser.username}</h5>

		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Account id:
			<strong>{targetUser.id}</strong></span
		>
		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Account creation date:
			<strong>{formatDate(new Date(targetUser.createdAt))}</strong></span
		>
		{#if $authenticatedUserStore && $authenticatedUserStore.id === targetUser.id}
			<span class="text-sm text-gray-500 dark:text-gray-400"
				>Account last updated at date:
				<strong>{formatDate(new Date(targetUser.updatedAt))}</strong></span
			>
			<span class="text-sm text-gray-500 dark:text-gray-400"
				>Account email:
				<strong>{targetUser.email.toLocaleLowerCase()}</strong></span
			>
		{/if}
		<hr class="border-0 h-px bg-gray-300 dark:bg-gray-600 my-6" />

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

		<div class="flex mt-4 space-x-3 rtl:space-x-reverse lg:mt-6">
			{#if $authenticatedUserStore}
				{#if $authenticatedUserStore.id !== targetUser.id}
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
				{:else}
					<Button href="/posts/liked" color="red">View liked posts</Button>
					<Button href="/posts/uploaded" color="blue">View uploaded posts</Button>
				{/if}
			{/if}
		</div>
	</div>
</Card>
