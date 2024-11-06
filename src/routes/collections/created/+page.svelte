<script lang="ts">
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

<CollectionsWrapper pageNumber={data.pageNumber} collections={data.collections} />
