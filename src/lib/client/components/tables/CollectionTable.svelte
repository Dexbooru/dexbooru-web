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
		collections: TAppSearchResult['collections'];
	};

	let { collections }: Props = $props();

	const globalQuery = getGlobalQuery();

	const onImageError = (event: Event) => {
		const target = event.target as HTMLImageElement;

		target.src = DefaultProfilePicture;
	};
</script>

<Table hoverable>
	<TableHead>
		<TableHeadCell>Title</TableHeadCell>
		<TableHeadCell>Description</TableHeadCell>
		<TableHeadCell>Created at</TableHeadCell>
		<TableHeadCell>Author</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only">View collection</span>
		</TableHeadCell>
	</TableHead>
	<TableBody class="divide-y">
		{#each collections ?? [] as collection (collection.id)}
			<TableBodyRow>
				<TableBodyCell class="whitespace-wrap px-1 py-4 font-medium">
					<HighlightedText query={$globalQuery} fullText={collection.title} />
				</TableBodyCell>
				<TableBodyCell class="whitespace-wrap px-1 py-4 font-medium">
					<HighlightedText query={$globalQuery} fullText={collection.description} />
				</TableBodyCell>
				<TableBodyCell>{formatDate(new Date(collection.createdAt))}</TableBodyCell>
				<TableBodyCell class="text-center">
					<Avatar
						class="mr-auto ml-auto"
						src={collection.uploaderProfilePictureUrl}
						alt="profile picture of {collection.uploaderName}"
						onerror={onImageError}
					/>
					<a
						href="/profile/{collection.uploaderName}"
						class="text-primary-600 dark:text-primary-500 font-medium hover:underline"
						>{collection.uploaderName}</a
					>
				</TableBodyCell>
				<TableBodyCell>
					<a
						href="/collections/{collection.id}"
						class="text-primary-600 dark:text-primary-500 font-medium hover:underline"
						>View collection</a
					>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
