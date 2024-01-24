<script lang="ts">
	import { page } from '$app/stores';
	import { postPaginationStore } from '$lib/client/stores/posts';
	import { buildUrl } from '$lib/shared/helpers/urls';
	import { PaginationItem } from 'flowbite-svelte';
	import { ArrowLeftSolid, ArrowRightSolid } from 'flowbite-svelte-icons';
	import { onDestroy } from 'svelte';

	export let noPostsLeft: boolean = false;

	let previousPageUrl: URL;
	let nextPageUrl: URL;

	const postPaginationUnsubscribe = postPaginationStore.subscribe((paginationData) => {
		if (paginationData) {
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

	onDestroy(() => {
		postPaginationUnsubscribe();
	});
</script>

{#if $postPaginationStore}
	<div id="pagination-container" class="flex space-x-3 justify-center {noPostsLeft && 'mt-5'}">
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
	</div>
{/if}
