<script lang="ts">
	import { page } from '$app/state';
	import { generateCollectionWrapperMetadata } from '$lib/client/helpers/collections';
	import {
		getCollectionPage,
		getCollectionPaginationData,
		getNsfwCollectionPage,
		getOriginalCollectionPage,
	} from '$lib/client/helpers/context';
	import type { TPostCollection } from '$lib/shared/types/collections';
	import { onMount } from 'svelte';
	import CollectionsContainer from './CollectionsContainer.svelte';

	interface Props {
		pageNumber: number;
		collections: TPostCollection[];
	}

	let { pageNumber, collections }: Props = $props();
	let pageTitle = $state('');
	let pageDescription = $state('');

	const collectionPaginationData = getCollectionPaginationData();
	const collectionsPage = getCollectionPage();
	const originalCollectionsPage = getOriginalCollectionPage();
	const nsfwCollectionsPage = getNsfwCollectionPage();

	$effect(() => {
		const { title, description } = generateCollectionWrapperMetadata(pageNumber, collections);
		pageTitle = title;
		pageDescription = description;
	});

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
	<title>{pageTitle}</title>
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:image" content={`${page.url.href}/favicon.png`} />
</svelte:head>

{#if $collectionPaginationData}
	<CollectionsContainer collectionContainerTitle={pageTitle} />
{/if}
