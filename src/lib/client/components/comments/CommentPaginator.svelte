<script lang="ts">
	import { page } from '$app/state';
	import { getCommentPaginationData } from '$lib/client/helpers/context';
	import { buildUrl } from '$lib/client/helpers/urls';
	import { MAXIMUM_COMMENTS_PER_PAGE } from '$lib/shared/constants/comments';
	import ArrowLeftOutline from 'flowbite-svelte-icons/ArrowLeftOutline.svelte';
	import ArrowRightOutline from 'flowbite-svelte-icons/ArrowRightOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import PaginationItem from 'flowbite-svelte/PaginationItem.svelte';
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
	<div id="pagination-container" class="m-3 flex justify-center space-x-3">
		{#if noCommentsOnPage && !['uploaded', 'liked'].find( (item) => page.url.href.includes(item), ) && $commentPaginationData.pageNumber > 0}
			<Button href={firstPageUrl.href} color="blue">Return to page 1</Button>
		{:else}
			{#if ($commentPaginationData.pageNumber - 1 >= 0 || noCommentsLeft) && $commentPaginationData.pageNumber !== 0}
				<PaginationItem
					href={previousPageUrl.href}
					size="large"
					class="previous-page-link flex items-center"
				>
					<ArrowLeftOutline class="mr-2 h-5 w-5" />
					Previous
				</PaginationItem>
			{/if}

			{#if !noCommentsLeft}
				<PaginationItem
					href={nextPageUrl.href}
					size="large"
					class="next-page-link flex items-center"
				>
					Next
					<ArrowRightOutline class="ml-2 h-5 w-5" />
				</PaginationItem>
			{/if}
		{/if}
	</div>
{/if}
