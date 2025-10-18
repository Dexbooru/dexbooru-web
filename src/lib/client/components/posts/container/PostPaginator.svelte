<script lang="ts">
	import { page } from '$app/state';
	import { getPostPaginationData } from '$lib/client/helpers/context';
	import { buildUrl } from '$lib/client/helpers/urls';
	import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
	import ArrowLeftSolid from 'flowbite-svelte-icons/ArrowLeftSolid.svelte';
	import ArrowRightSolid from 'flowbite-svelte-icons/ArrowRightSolid.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import PaginationItem from 'flowbite-svelte/PaginationItem.svelte';
	import { onMount } from 'svelte';

	let previousPageUrl: URL = $state(new URL('http://mock.com'));
	let nextPageUrl: URL = $state(new URL('http://mock.com'));
	let noPostsLeft: boolean = $state(false);
	let noPostsOnPage: boolean = $state(false);

	const postPaginationData = getPostPaginationData();

	const postPaginationUnsubscribe = postPaginationData.subscribe((paginationData) => {
		if (paginationData) {
			noPostsLeft = paginationData.posts.length !== MAXIMUM_POSTS_PER_PAGE;
			noPostsOnPage = paginationData.posts.length === 0;

			const previousPageLinkParams = {
				...(page.url.pathname === '/search' ? { query: page.url.searchParams.get('query') } : {}),
				pageNumber: paginationData.pageNumber - 1,
				orderBy: paginationData.orderBy,
				ascending: paginationData.ascending,
			};
			const nextPageLinkParams = {
				...(page.url.pathname === '/search' ? { query: page.url.searchParams.get('query') } : {}),
				pageNumber: paginationData.pageNumber + 1,
				orderBy: paginationData.orderBy,
				ascending: paginationData.ascending,
			};

			previousPageUrl = buildUrl(page.url.pathname, previousPageLinkParams);
			nextPageUrl = buildUrl(page.url.pathname, nextPageLinkParams);
		}
	});

	const firstPageUrl = buildUrl(page.url.pathname, {
		...(page.url.pathname === '/search' ? { query: page.url.searchParams.get('query') } : {}),
		pageNumber: '0',
		orderBy: page.url.searchParams.get('orderBy') ?? 'createdAt',
		ascending: page.url.searchParams.get('ascending') ?? false,
	});

	onMount(() => {
		return () => {
			postPaginationUnsubscribe();
		};
	});
</script>

{#if $postPaginationData}
	<div id="pagination-container" class="flex flex-wrap gap-3 justify-center">
		{#if noPostsOnPage && !!!['uploaded', 'liked'].find( (item) => page.url.href.includes(item), ) && $postPaginationData.pageNumber > 0}
			<Button href={firstPageUrl.href} color="blue">Return to page 1</Button>
		{:else}
			{#if ($postPaginationData.pageNumber - 1 >= 0 || noPostsLeft) && $postPaginationData.pageNumber !== 0}
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
