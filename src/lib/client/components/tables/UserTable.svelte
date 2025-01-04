<script lang="ts">
	import { getGlobalQuery } from '$lib/client/helpers/context';
	import { formatDate } from '$lib/shared/helpers/dates';
	import type { TAppSearchResult } from '$lib/shared/types/search';
	import {
		Avatar,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
	} from 'flowbite-svelte';
	import HighlightedText from '../reusable/HighlightedText.svelte';

	interface Props {
		users: TAppSearchResult['users'];
	}

	let { users }: Props = $props();

	const globalQuery = getGlobalQuery();
</script>

<Table hoverable>
	<TableHead>
		<TableHeadCell>ID</TableHeadCell>
		<TableHeadCell>Username</TableHeadCell>
		<TableHeadCell>Created at</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only">View profile</span>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#each users ?? [] as user (user.id)}
			<TableBodyRow>
				<TableBodyCell>
					<HighlightedText query={$globalQuery} fullText={user.id} />
				</TableBodyCell>
				<TableBodyCell class="text-center">
					<Avatar
						class="ml-auto mr-auto"
						src={user.profilePictureUrl}
						alt="profile picture of {user.username}"
					/>
					<a
						href="/profile/{user.username}"
						class="font-medium text-primary-600 hover:underline dark:text-primary-500"
					>
						<HighlightedText query={$globalQuery} fullText={user.username} />
					</a>
				</TableBodyCell>
				<TableBodyCell>{formatDate(new Date(user.createdAt))}</TableBodyCell>
				<TableBodyCell>
					<a
						href="/profile/{user.username}"
						class="font-medium text-primary-600 hover:underline dark:text-primary-500"
						>View profile</a
					>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
