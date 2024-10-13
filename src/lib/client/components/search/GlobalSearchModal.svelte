<script lang="ts">
	import { getGlobalSearchResults } from '$lib/client/api/search';
	import { GLOBAL_SEARCH_MODAL_NAME } from '$lib/client/constants/layout';
	import {
		GLOBAL_SEARCH_INPUT_ELEMENT_ID,
		SEARCH_DEBOUNCE_TIMEOUT_MS,
	} from '$lib/client/constants/search';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { debounce, memoize } from '$lib/client/helpers/util';
	import { modalStore } from '$lib/client/stores/layout';
	import { queryStore } from '$lib/client/stores/search';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { IAppSearchResult } from '$lib/shared/types/search';
	import { toast } from '@zerodevx/svelte-toast';
	import { Modal, Spinner } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';
	import Searchbar from '../reusable/Searchbar.svelte';
	import SearchResultsContainer from './SearchResultsContainer.svelte';

	let currentSearchResults: IAppSearchResult | null = null;
	let searchResultsLoading = false;

	const modalStoreUnsubscribe = modalStore.subscribe((data) => {
		if (data.focusedModalName === GLOBAL_SEARCH_MODAL_NAME) {
			const globalSearchInput = document.querySelector(
				`#${GLOBAL_SEARCH_INPUT_ELEMENT_ID}`,
			) as HTMLInputElement | null;
			if (globalSearchInput) {
				globalSearchInput.focus();
			}
		} else {
			currentSearchResults = null;
		}
	});

	const fetchQueryResults = memoize(async (query: string) => {
		const response = await getGlobalSearchResults(query);
		if (response.ok) {
			const responseData: TApiResponse<IAppSearchResult> = await response.json();
			return responseData.data;
		} else {
			toast.push(
				'An unexpected error occured while retrieving the search results',
				FAILURE_TOAST_OPTIONS,
			);
			return null;
		}
	}, true);

	const clearResultsOnEmptyQuery = (query: string) => {
		if (query.length === 0) {
			currentSearchResults = null;
		}
	};

	const debouncedFetchQueryResults = debounce(async (query: string) => {
		searchResultsLoading = true;
		queryStore.set(query);
		currentSearchResults = query ? await fetchQueryResults(query as never) : null;
		searchResultsLoading = false;
	}, SEARCH_DEBOUNCE_TIMEOUT_MS) as (query: string) => void;

	onDestroy(() => {
		modalStoreUnsubscribe();
	});
</script>

<Modal
	title="Find tags, artists, users and posts"
	open={$modalStore.isOpen && $modalStore.focusedModalName === GLOBAL_SEARCH_MODAL_NAME}
	outsideclose
	class="w-screen"
	placement="top-center"
	on:close={() => modalStore.set({ isOpen: false, focusedModalName: null })}
>
	<div class="flex relative">
		<Searchbar
			inputElementId={GLOBAL_SEARCH_INPUT_ELEMENT_ID}
			isGlobal
			width="100%"
			placeholder="Enter your search query"
			queryInputHandler={debouncedFetchQueryResults}
			queryChangeHandler={clearResultsOnEmptyQuery}
		/>
		{#if searchResultsLoading}
			<Spinner color="pink" class="absolute top-2 right-2" size="7" />
		{/if}
	</div>

	{#if currentSearchResults}
		<SearchResultsContainer results={currentSearchResults} />
	{/if}
</Modal>
