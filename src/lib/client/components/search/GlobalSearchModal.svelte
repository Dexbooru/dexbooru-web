<script lang="ts">
	import { getGlobalSearchResults } from '$lib/client/api/search';
	import { GLOBAL_SEARCH_MODAL_NAME } from '$lib/client/constants/layout';
	import {
		GLOBAL_SEARCH_INPUT_ELEMENT_ID,
		SEARCH_DEBOUNCE_TIMEOUT_MS,
	} from '$lib/client/constants/search';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getActiveModal, getGlobalQuery } from '$lib/client/helpers/context';
	import { debounce, memoize } from '$lib/client/helpers/util';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { TAppSearchResult } from '$lib/shared/types/search';
	import { toast } from '@zerodevx/svelte-toast';
	import GradientButton from 'flowbite-svelte/GradientButton.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import { onMount } from 'svelte';
	import Searchbar from '../reusable/Searchbar.svelte';
	import SearchResultsContainer from './SearchResultsContainer.svelte';

	let currentSearchResults: TAppSearchResult | null = $state(null);
	let searchResultsLoading = $state(false);

	const activeModal = getActiveModal();
	const globalQuery = getGlobalQuery();

	const modalStoreUnsubscribe = activeModal.subscribe((data) => {
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

	const fetchQueryResults = memoize(async (query: unknown) => {
		const response = await getGlobalSearchResults(query as string);
		if (response.ok) {
			const responseData: TApiResponse<TAppSearchResult> = await response.json();
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
		globalQuery.set(query);
		currentSearchResults = query ? await fetchQueryResults(query) : null;
		searchResultsLoading = false;
	}, SEARCH_DEBOUNCE_TIMEOUT_MS) as (query: string) => void;

	onMount(() => {
		const searchbarInput = document.getElementById(
			GLOBAL_SEARCH_INPUT_ELEMENT_ID,
		) as HTMLInputElement;
		const clearSearchResultsIntervalId = setInterval(() => {
			if (searchbarInput && searchbarInput.value.length === 0) {
				currentSearchResults = null;
			}
		}, 500);

		return () => {
			clearInterval(clearSearchResultsIntervalId);
			modalStoreUnsubscribe();
		};
	});
</script>

<Modal
	title="Find global resources"
	open={$activeModal.isOpen && $activeModal.focusedModalName === GLOBAL_SEARCH_MODAL_NAME}
	outsideclose
	class="w-screen"
	placement="top-center"
	onclose={() => activeModal.set({ isOpen: false, focusedModalName: null })}
>
	<div class="flex relative">
		<Searchbar
			inputElementId={GLOBAL_SEARCH_INPUT_ELEMENT_ID}
			isGlobal
			autofocus
			width="100%"
			placeholder="Enter your search query"
			queryInputHandler={debouncedFetchQueryResults}
			queryChangeHandler={clearResultsOnEmptyQuery}
		/>
		{#if searchResultsLoading}
			<Spinner color="pink" class="absolute top-2 right-2" size="4" />
		{/if}
	</div>

	{#if currentSearchResults}
		<SearchResultsContainer results={currentSearchResults} />
	{/if}

	<GradientButton
		color="green"
		onclick={() => activeModal.set({ isOpen: false, focusedModalName: null })}
		href="/similarity-search">Find posts via similarity search here</GradientButton
	>
</Modal>
