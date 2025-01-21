<script lang="ts">
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
		collections: TAppSearchResult['collections'];
	};

	let { collections }: Props = $props();

	const globalQuery = getGlobalQuery();
</script>

<Table hoverable>
	<TableHead>
		<TableHeadCell>ID</TableHeadCell>
		<TableHeadCell>Title</TableHeadCell>
		<TableHeadCell>Description</TableHeadCell>
		<TableHeadCell>Created at</TableHeadCell>
		<TableHeadCell>Author</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only">View collection</span>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#each collections ?? [] as collection}
			<TableBodyRow>
				<TableBodyCell>{collection.id}</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-4 whitespace-wrap font-medium">
					<HighlightedText query={$globalQuery} fullText={collection.title} />
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-4 whitespace-wrap font-medium">
					<HighlightedText query={$globalQuery} fullText={collection.description} />
				</TableBodyCell>
				<TableBodyCell>{formatDate(new Date(collection.createdAt))}</TableBodyCell>
				<TableBodyCell class="text-center">
					<Avatar
						class="ml-auto mr-auto"
						src={collection.uploaderProfilePictureUrl}
						alt="profile picture of {collection.uploaderName}"
					/>
					<a
						href="/profile/{collection.uploaderName}"
						class="font-medium text-primary-600 hover:underline dark:text-primary-500"
						>{collection.uploaderName}</a
					>
				</TableBodyCell>
				<TableBodyCell>
					<a
						href="/collections/{collection.id}"
						class="font-medium text-primary-600 hover:underline dark:text-primary-500"
						>View collection</a
					>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
