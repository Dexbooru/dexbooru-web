<script lang="ts">
	import CollectionsWrapper from '$lib/client/components/collections/container/CollectionsWrapper.svelte';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/collections';
	import { updateCollectionStores } from '$lib/client/helpers/collections';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	$effect(() => {
		updateCollectionStores(data);
	});
</script>

<CollectionsWrapper
	containerTitle="Collections ordered by {ORDER_BY_TRANSLATION_MAP[data.orderBy]?.find(
		({ isActive }) => isActive?.(data.orderBy, data.ascending),
	)?.label} - Page {data.pageNumber + 1}"
	collections={data.collections}
/>
