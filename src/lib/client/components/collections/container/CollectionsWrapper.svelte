<script lang="ts">
	import { page } from '$app/state';
	import { generateCollectionWrapperMetadata } from '$lib/client/helpers/collections';
	import {
		getCollectionPage,
		getCollectionPaginationData,
		getNsfwCollectionPage,
		getOriginalCollectionPage,
	} from '$lib/client/helpers/context';
	import type { TCollectionOrderByColumn, TPostCollection } from '$lib/shared/types/collections';
	import { onMount } from 'svelte';
	import CollectionsContainer from './CollectionsContainer.svelte';

	interface Props {
		containerTitle: string;
		collections: TPostCollection[];
	}

	let { collections, containerTitle }: Props = $props();
	let titleData = $derived.by(() => {
		return generateCollectionWrapperMetadata(
			page.data.pageNumber ?? 0,
			page.data.orderBy as TCollectionOrderByColumn,
			page.data.ascending ?? false,
			collections,
		);
	});

	const collectionPaginationData = getCollectionPaginationData();
	const collectionsPage = getCollectionPage();
	const originalCollectionsPage = getOriginalCollectionPage();
	const nsfwCollectionsPage = getNsfwCollectionPage();

	onMount(() => {
		return () => {
			collectionPaginationData.set(null);
			collectionsPage.set([]);
			originalCollectionsPage.set([]);
			nsfwCollectionsPage.set([]);
		};
	});
</script>

<svelte:head>
	<title>{titleData.title}</title>
	<meta property="og:title" content={titleData.title} />
	<meta property="og:description" content={titleData.description} />
	<meta property="og:image" content={`${page.url.href}/favicon.png`} />
</svelte:head>

<CollectionsContainer collectionContainerTitle={containerTitle} />
