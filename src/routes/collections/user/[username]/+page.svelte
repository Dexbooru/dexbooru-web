<script lang="ts">
	import { page } from '$app/state';
	import CollectionsWrapper from '$lib/client/components/collections/container/CollectionsWrapper.svelte';
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
	containerTitle="Collections by {page.params.username} - Page {data.pageNumber + 1}"
	collections={data.collections}
/>
