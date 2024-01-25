<script lang="ts">
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { IUser } from '$lib/shared/types/users';
	import { Avatar, Button, Card, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { DotsHorizontalOutline } from 'flowbite-svelte-icons';

	export let targetUser: IUser;
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
		<Avatar size="lg" src={targetUser.profilePictureUrl} />
		<h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">{targetUser.username}</h5>

		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Account creation date:
			<strong>{formatDate(targetUser.createdAt)}</strong></span
		>
		<span class="text-sm text-gray-500 dark:text-gray-400"
			>Account email:
			<strong>{targetUser.email}</strong></span
		>
		<div class="flex mt-4 space-x-3 rtl:space-x-reverse lg:mt-6">
			{#if $authenticatedUserStore}
				{#if $authenticatedUserStore.id !== targetUser.id}
					<Button>Add friend</Button>
				{:else}
					<Button href="/profile/posts/liked" color="red">View liked posts</Button>
					<Button href="/profile/posts/uploaded" color="blue">View uploaded posts</Button>
				{/if}
			{/if}
		</div>
	</div>
</Card>
