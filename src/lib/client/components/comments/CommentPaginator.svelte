<script lang="ts">
	import { page } from '$app/state';
	import { getCommentPaginationData } from '$lib/client/helpers/context';
	import { buildUrl } from '$lib/client/helpers/urls';
	import { MAXIMUM_COMMENTS_PER_PAGE } from '$lib/shared/constants/comments';
	import Button from 'flowbite-svelte/Button.svelte';
	import PaginationItem from 'flowbite-svelte/PaginationItem.svelte';
	import ArrowLeftSolid from 'flowbite-svelte-icons/ArrowLeftSolid.svelte';
	import ArrowRightSolid from 'flowbite-svelte-icons/ArrowRightSolid.svelte';
	import { onMount } from 'svelte';

	let previousPageUrl: URL = $state(new URL('http://mock.com'));
	let nextPageUrl: URL = $state(new URL('http://mock.com'));
	let noCommentsLeft: boolean = $state(false);
	let noCommentsOnPage: boolean = $state(false);

	const commentPaginationData = getCommentPaginationData();

	const commentPaginationUnsubscribe = commentPaginationData.subscribe((paginationData) => {
		if (paginationData) {
			noCommentsLeft = paginationData.comments.length !== MAXIMUM_COMMENTS_PER_PAGE;
			noCommentsOnPage = paginationData.comments.length === 0;

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

	const firstPageUrl = buildUrl(page.url.pathname, {
		pageNumber: '0',
		orderBy: page.url.searchParams.get('orderBy') ?? 'createdAt',
		ascending: page.url.searchParams.get('ascending') ?? false,
	});

	onMount(() => {
		return () => {
			commentPaginationUnsubscribe();
		};
	});
</script>

{#if $commentPaginationData}
	<div id="pagination-container" class="flex m-3 space-x-3 justify-center">
		{#if noCommentsOnPage && !!!['uploaded', 'liked'].find( (item) => page.url.href.includes(item), ) && $commentPaginationData.pageNumber > 0}
			<Button href={firstPageUrl.href} color="blue">Return to page 1</Button>
		{:else}
			{#if ($commentPaginationData.pageNumber - 1 >= 0 || noCommentsLeft) && $commentPaginationData.pageNumber !== 0}
				<PaginationItem
					href={previousPageUrl.href}
					large
					class="flex items-center previous-page-link"
				>
					<ArrowLeftSolid class="mr-2 w-5 h-5" />
					Previous
				</PaginationItem>
			{/if}

			{#if !noCommentsLeft}
				<PaginationItem href={nextPageUrl.href} large class="flex items-center next-page-link">
					Next
					<ArrowRightSolid class="ml-2 w-5 h-5" />
				</PaginationItem>
			{/if}
		{/if}
	</div>
{/if}
