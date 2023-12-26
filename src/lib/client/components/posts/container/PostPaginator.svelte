<script lang="ts">
	import { PaginationItem } from 'flowbite-svelte';
	import { ArrowLeftSolid, ArrowRightSolid } from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { TPostOrderByColumn } from '$lib/shared/types/posts';

	export let pageNumber: number;
	export let orderBy: TPostOrderByColumn = 'createdAt';
	export let noPostsLeft: boolean = false;

	onMount(() => {
		const paginationContainer: HTMLDivElement | null =
			document.querySelector('#pagination-container');
		if (paginationContainer) {
			const paginationLinks = paginationContainer.getElementsByTagName('a');
			(Array.from(paginationLinks) as HTMLAnchorElement[]).forEach((paginationLink) => {
				paginationLink.dataset['data-sveltekit-reload'] = 'true';
			});
		}
	});

	const postsBaseUrl = $page.url.origin + $page.url.pathname;
	const previousPageUrl = new URL(postsBaseUrl);
	const nextPageUrl = new URL(postsBaseUrl);

	previousPageUrl.searchParams.append('pageNumber', (pageNumber - 1).toString());
	previousPageUrl.searchParams.append('orderBy', orderBy);
	nextPageUrl.searchParams.append('pageNumber', (pageNumber + 1).toString());
	nextPageUrl.searchParams.append('orderBy', orderBy);
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
