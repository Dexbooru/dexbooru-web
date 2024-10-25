<script lang="ts">
	import { run } from 'svelte/legacy';

	import CollectionsGrid from '$lib/client/collections/CollectionsGrid.svelte';
	import { updateCollectionPagination } from '$lib/client/helpers/context';
	import type { ActionData, PageData } from './$types';

	interface Props {
		form: ActionData;
		data: PageData;
	}

	let { form, data }: Props = $props();

	run(() => {
		updateCollectionPagination(data);
	});
</script>

<svelte:head>
	<title>Collections</title>
</svelte:head>

<CollectionsGrid />
