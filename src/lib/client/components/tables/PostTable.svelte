<script lang="ts">
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

	export let posts: TAppSearchResult['posts'];
</script>

<Table hoverable>
	<TableHead>
		<TableHeadCell>ID</TableHeadCell>
		<TableHeadCell>Description</TableHeadCell>
		<TableHeadCell>Created at</TableHeadCell>
		<TableHeadCell>Author</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only">View post</span>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#each posts || [] as post}
			<TableBodyRow>
				<TableBodyCell>{post.id}</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-4 whitespace-wrap font-medium">
					{post.description}
				</TableBodyCell>
				<TableBodyCell>{formatDate(new Date(post.createdAt))}</TableBodyCell>
				<TableBodyCell class="text-center">
					<Avatar
						class="ml-auto mr-auto booru-avatar"
						src={post.uploaderProfilePictureUrl}
						alt="profile picture of {post.uploaderName}"
					/>
					<a
						href="/profile/{post.uploaderName}"
						class="font-medium text-primary-600 hover:underline dark:text-primary-500"
						>{post.uploaderName}</a
					>
				</TableBodyCell>
				<TableBodyCell>
					<a
						href="/posts/{post.id}"
						class="font-medium text-primary-600 hover:underline dark:text-primary-500">View post</a
					>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
