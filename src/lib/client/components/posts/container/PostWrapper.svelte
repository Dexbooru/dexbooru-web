<script lang="ts">
	import { page } from '$app/stores';
	import PostContainer from '$lib/client/components/posts/container/PostContainer.svelte';
	import { ORDER_BY_TRANSLATION_MAP } from '$lib/client/constants/posts';
	import { getPostPaginationData } from '$lib/client/helpers/context';
	import { onDestroy } from 'svelte';

	interface Props {
		postsSection: string;
	}

	let { postsSection }: Props = $props();

	let currentPageTitle: string = $state('');
	let currentPageDescription: string = $state('');

	const postPaginationData = getPostPaginationData();
	const postPaginationUnsubscribe = postPaginationData.subscribe((paginationData) => {
		if (paginationData) {
			currentPageTitle = `${postsSection} - Page ${paginationData.pageNumber + 1}`;

			const orderTranslationOptions = ORDER_BY_TRANSLATION_MAP[paginationData.orderBy];
			const matchingOrderTranslationOption = orderTranslationOptions.find((translationOption) =>
				translationOption.isActive(paginationData.orderBy, paginationData.ascending),
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
	<title>{currentPageTitle}</title>
	<meta property="og:title" content={currentPageTitle} />
	<meta property="og:description" content={currentPageDescription} />
	<meta property="og:image" content={`${$page.url.href}/favicon.png`} />
</svelte:head>

<PostContainer postContainerTitle={currentPageTitle} />
