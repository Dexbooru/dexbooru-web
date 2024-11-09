<script lang="ts">
	import { applyLazyLoadingOnImageClass } from '$lib/client/helpers/dom';
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
	import { onMount } from 'svelte';

	type Props = {
		collections: TAppSearchResult['collections'];
	};

	let { collections }: Props = $props();

	onMount(() => {
		applyLazyLoadingOnImageClass('booru-avatar-search-table-collections');
	});
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
					{collection.title}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-4 whitespace-wrap font-medium">
					{collection.description}
				</TableBodyCell>
				<TableBodyCell>{formatDate(new Date(collection.createdAt))}</TableBodyCell>
				<TableBodyCell class="text-center">
					<Avatar
						class="ml-auto mr-auto booru-avatar-search-table-posts"
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
						class="font-medium text-primary-600 hover:underline dark:text-primary-500">View collection</a
					>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
