<script lang="ts">
	import { getGlobalQuery } from '$lib/client/helpers/context';
	import type { TAppSearchResult } from '$lib/shared/types/search';
	import Table from 'flowbite-svelte/Table.svelte';
	import TableBody from 'flowbite-svelte/TableBody.svelte';
	import TableBodyCell from 'flowbite-svelte/TableBodyCell.svelte';
	import TableBodyRow from 'flowbite-svelte/TableBodyRow.svelte';
	import TableHead from 'flowbite-svelte/TableHead.svelte';
	import TableHeadCell from 'flowbite-svelte/TableHeadCell.svelte';
	import HighlightedText from '../reusable/HighlightedText.svelte';

	type Props = {
		labels: TAppSearchResult['tags'] | TAppSearchResult['artists'];
		labelType: 'tag' | 'artist';
	};

	let { labels, labelType }: Props = $props();

	const globalQuery = getGlobalQuery();
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
		{#each labels ?? [] as label (label.id)}
			<TableBodyRow>
				<TableBodyCell>
					<HighlightedText query={$globalQuery} fullText={label.id} />
				</TableBodyCell>
				<TableBodyCell>
					<HighlightedText query={$globalQuery} fullText={label.name} />
				</TableBodyCell>
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
