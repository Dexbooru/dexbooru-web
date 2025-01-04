<script lang="ts">
	import { getGlobalQuery } from '$lib/client/helpers/context';
	import type { TAppSearchResult } from '$lib/shared/types/search';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
	} from 'flowbite-svelte';
	import HighlightedText from '../reusable/HighlightedText.svelte';

	interface Props {
		labels: TAppSearchResult['tags'] | TAppSearchResult['artists'];
		labelType: 'tag' | 'artist';
	}

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
