<script lang="ts">
	import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
	import { getGlobalQuery } from '$lib/client/helpers/context';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TAppSearchResult } from '$lib/shared/types/search';
	import Avatar from 'flowbite-svelte/Avatar.svelte';
	import Table from 'flowbite-svelte/Table.svelte';
	import TableBody from 'flowbite-svelte/TableBody.svelte';
	import TableBodyCell from 'flowbite-svelte/TableBodyCell.svelte';
	import TableBodyRow from 'flowbite-svelte/TableBodyRow.svelte';
	import TableHead from 'flowbite-svelte/TableHead.svelte';
	import TableHeadCell from 'flowbite-svelte/TableHeadCell.svelte';
	import HighlightedText from '../reusable/HighlightedText.svelte';

	type Props = {
		users: TAppSearchResult['users'];
	};

	let { users }: Props = $props();

	const globalQuery = getGlobalQuery();

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;

		target.src = DefaultProfilePicture;
	};
</script>

<Table hoverable>
	<TableHead>
		<TableHeadCell>Username</TableHeadCell>
		<TableHeadCell>Created at</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only">View profile</span>
		</TableHeadCell>
	</TableHead>
	<TableBody class="divide-y">
		{#each users ?? [] as user (user.id)}
			<TableBodyRow>
				<TableBodyCell class="text-center">
					<Avatar
						class="mr-auto ml-auto"
						src={user.profilePictureUrl}
						onerror={onImageError}
						alt="profile picture of {user.username}"
					/>
					<a
						href="/profile/{user.username}"
						class="text-primary-600 dark:text-primary-500 font-medium hover:underline"
					>
						<HighlightedText query={$globalQuery} fullText={user.username} />
					</a>
				</TableBodyCell>
				<TableBodyCell>{formatDate(new Date(user.createdAt))}</TableBodyCell>
				<TableBodyCell>
					<a
						href="/profile/{user.username}"
						class="text-primary-600 dark:text-primary-500 font-medium hover:underline"
						>View profile</a
					>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
