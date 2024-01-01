<script lang="ts">
	import { page } from '$app/stores';
	import { buildUrl } from '$lib/shared/helpers/urls';
	import type { TPostOrderByColumn } from '$lib/shared/types/posts';
	import { PaginationItem } from 'flowbite-svelte';
	import { ArrowLeftSolid, ArrowRightSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';

	export let pageNumber: number;
	export let orderBy: TPostOrderByColumn = 'createdAt';
	export let ascending: boolean = false;
	export let noPostsLeft: boolean = false;

	onMount(() => {
		const paginationContainer: HTMLDivElement | null =
			document.querySelector('#pagination-container');
		if (paginationContainer) {
			const paginationLinks = paginationContainer.getElementsByTagName('a');
			(Array.from(paginationLinks) as HTMLAnchorElement[]).forEach((paginationLink) => {
				paginationLink.dataset.sveltekitReload = 'true';
			});
		}
	});

	const previousPageLinkParams = {
		pageNumber: pageNumber - 1,
		orderBy,
		ascending
	};

	const nextPageLinkParams = {
		pageNumber: pageNumber + 1,
		orderBy,
		ascending
	};
	
	const previousPageUrl = buildUrl($page.url.pathname, previousPageLinkParams);
	const nextPageUrl = buildUrl($page.url.pathname, nextPageLinkParams);
</script>

<div id="pagination-container" class="flex space-x-3 justify-center {noPostsLeft && 'mt-5'}">
	{#if (pageNumber - 1 >= 0 || noPostsLeft) && pageNumber !== 0}
		<PaginationItem href={previousPageUrl.href} large class="flex items-center previous-page-link">
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
