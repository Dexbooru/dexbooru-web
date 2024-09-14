<script lang="ts">
	import { page } from '$app/stores';
	import PostContainer from '$lib/client/components/posts/container/PostContainer.svelte';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/posts';
	import { postPaginationStore } from '$lib/client/stores/posts';
	import { onDestroy } from 'svelte';

	export let postsSection: string;
	export let overrideTitle: boolean = true;

	let currentPageTitle: string;
	let currentPageDescription: string;

	const postPaginationUnsubscribe = postPaginationStore.subscribe((paginationData) => {
		if (paginationData) {
			currentPageTitle = `${postsSection} - Page ${paginationData.pageNumber + 1}`;

			const orderTranslationOptions = ORDER_BY_TRANSLATION_MAP[paginationData.orderBy];
			const matchingOrderTranslationOption = orderTranslationOptions.find((translationOption) =>
				translationOption.isActive(paginationData.orderBy, paginationData.ascending)
			);
			if (matchingOrderTranslationOption) {
				currentPageDescription = `${paginationData.posts.length} post(s) sorted by the ${matchingOrderTranslationOption.label} category`;
			}
		}
	});

	onDestroy(() => {
		postPaginationUnsubscribe();
	});
</script>

<svelte:head>
	{#if overrideTitle}
		<title>{currentPageTitle}</title>
	{/if}
	<meta property="og:title" content={currentPageTitle} />
	<meta property="og:description" content={currentPageDescription} />
	<meta property="og:image" content={`${$page.url.href}/favicon.png`} />
</svelte:head>

<PostContainer postContainerTitle={currentPageTitle} />
