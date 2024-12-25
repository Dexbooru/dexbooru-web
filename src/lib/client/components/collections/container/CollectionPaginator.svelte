<script lang="ts">
	import { page } from '$app/state';
	import { getCollectionPaginationData } from '$lib/client/helpers/context';
	import { buildUrl } from '$lib/client/helpers/urls';
	import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
	import { Button, PaginationItem } from 'flowbite-svelte';
	import { ArrowLeftSolid, ArrowRightSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';

	let previousPageUrl: URL = $state(new URL('http://mock.com'));
	let nextPageUrl: URL = $state(new URL('http://mock.com'));
	let noCollectionsLeft: boolean = $state(false);
	let noCollectionsOnPage: boolean = $state(false);

	const collectionPaginationData = getCollectionPaginationData();

	const postPaginationUnsubscribe = collectionPaginationData.subscribe((paginationData) => {
		if (paginationData) {
			noCollectionsLeft = paginationData.collections.length !== MAXIMUM_POSTS_PER_PAGE;
			noCollectionsOnPage = paginationData.collections.length === 0;

			const previousPageLinkParams = {
				pageNumber: paginationData.pageNumber - 1,
				orderBy: paginationData.orderBy,
				ascending: paginationData.ascending,
			};
			const nextPageLinkParams = {
				pageNumber: paginationData.pageNumber + 1,
				orderBy: paginationData.orderBy,
				ascending: paginationData.ascending,
			};

			previousPageUrl = buildUrl(page.url.pathname, previousPageLinkParams);
			nextPageUrl = buildUrl(page.url.pathname, nextPageLinkParams);
		}
	});

	const firstPageUrl = buildUrl('/', {
		pageNumber: '0',
	});

	onMount(() => {
		return () => {
			postPaginationUnsubscribe();
		};
	});
</script>

{#if $collectionPaginationData}
	<div
		id="pagination-container"
		class="flex space-x-3 justify-center {noCollectionsLeft && 'mt-5'}"
	>
		{#if noCollectionsOnPage && !!!['collections/created'].find( (item) => page.url.href.includes(item), )}
			<Button href={firstPageUrl.href} color="blue">Return to page 1</Button>
		{:else}
			{#if ($collectionPaginationData.pageNumber - 1 >= 0 || noCollectionsLeft) && $collectionPaginationData.pageNumber !== 0}
				<PaginationItem
					href={previousPageUrl.href}
					large
					class="flex items-center previous-page-link"
				>
					<ArrowLeftSolid class="mr-2 w-5 h-5" />
					Previous
				</PaginationItem>
			{/if}

			{#if !noCollectionsLeft}
				<PaginationItem href={nextPageUrl.href} large class="flex items-center next-page-link">
					Next
					<ArrowRightSolid class="ml-2 w-5 h-5" />
				</PaginationItem>
			{/if}
		{/if}
	</div>
{/if}
