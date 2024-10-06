<script lang="ts">
	import { page } from '$app/stores';
	import { postPaginationStore } from '$lib/client/stores/posts';
	import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
	import { buildUrl } from '$lib/shared/helpers/urls';
	import { Button, PaginationItem } from 'flowbite-svelte';
	import { ArrowLeftSolid, ArrowRightSolid } from 'flowbite-svelte-icons';
	import { onDestroy } from 'svelte';

	let previousPageUrl: URL;
	let nextPageUrl: URL;
	let noPostsLeft: boolean = false;
	let noPostsOnPage: boolean = false;

	const postPaginationUnsubscribe = postPaginationStore.subscribe((paginationData) => {
		if (paginationData) {
			noPostsLeft = paginationData.posts.length !== MAXIMUM_POSTS_PER_PAGE;
			noPostsOnPage = paginationData.posts.length === 0;

			const previousPageLinkParams = {
				pageNumber: paginationData.pageNumber - 1,
				orderBy: paginationData.orderBy,
				ascending: paginationData.ascending
			};

			const nextPageLinkParams = {
				pageNumber: paginationData.pageNumber + 1,
				orderBy: paginationData.orderBy,
				ascending: paginationData.ascending
			};
			previousPageUrl = buildUrl($page.url.pathname, previousPageLinkParams);
			nextPageUrl = buildUrl($page.url.pathname, nextPageLinkParams);
		}
	});

	const firstPageUrl = new URL($page.url.href);
	firstPageUrl.searchParams.set('pageNumber', '0');

	onDestroy(() => {
		postPaginationUnsubscribe();
	});
</script>

{#if $postPaginationStore}
	<div id="pagination-container" class="flex space-x-3 justify-center {noPostsLeft && 'mt-5'}">
		{#if noPostsOnPage && !!!['uploaded', 'liked'].find(item => $page.url.href.includes(item))}
			<Button href={firstPageUrl.href} color="blue">Return to Home</Button>
		{:else}
			{#if ($postPaginationStore.pageNumber - 1 >= 0 || noPostsLeft) && $postPaginationStore.pageNumber !== 0}
				<PaginationItem
					href={previousPageUrl.href}
					large
					class="flex items-center previous-page-link"
				>
					<ArrowLeftSolid class="mr-2 w-5 h-5" />
					Previous
				</PaginationItem>
			{/if}

			{#if !noPostsLeft}
				<PaginationItem href={nextPageUrl.href} large class="flex items-center next-page-link">
					Next
					<ArrowRightSolid class="ml-2 w-5 h-5" />
				</PaginationItem>
			{/if}
		{/if}
	</div>
{/if}
