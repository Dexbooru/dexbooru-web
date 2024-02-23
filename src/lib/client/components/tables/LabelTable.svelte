<script lang="ts">
	import type { IAppSearchResult } from '$lib/shared/types/search';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	export let labels: IAppSearchResult['tags'] | IAppSearchResult['artists'];
	export let labelType: 'tag' | 'artist';
</script>

<Table hoverable>
	<TableHead>
		<TableHeadCell>ID</TableHeadCell>
		<TableHeadCell>Name</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only">Related posts</span>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#each labels || [] as label}
			<TableBodyRow>
				<TableBodyCell>{label.id}</TableBodyCell>
				<TableBodyCell>{label.name}</TableBodyCell>
				<TableBodyCell>
					<a
						href="/posts/{labelType}/{label.name}"
						class="font-medium text-primary-600 hover:underline dark:text-primary-500"
						>Related posts</a
					>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
