<script lang="ts">
	import { getGlobalSearchResults } from '$lib/client/api/search';
	import ApplicationLogo from '$lib/client/assets/app_logo.webp';
	import Searchbar from '$lib/client/components/reusable/Searchbar.svelte';
	import SearchResultsDropdown from '$lib/client/components/search/SearchResultsDropdown.svelte';
	import { SEARCH_DEBOUNCE_TIMEOUT_MS } from '$lib/client/constants/search';
	import { formatNumberWithCommas } from '$lib/client/helpers/posts';
	import { debounce } from '$lib/client/helpers/util';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { TAppSearchResult } from '$lib/shared/types/search';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
	let { collectionCount, userCount, tagCount, artistCount, postCount } = data;

	let labelSearchResults = $state<TAppSearchResult>({
		tags: [],
		artists: [],
	});

	const handleSearchbarInput = debounce(async (query: unknown) => {
		if ((query as string).length === 0) {
			labelSearchResults = {
				tags: [],
				artists: [],
			};
			return;
		}

		const tokens = (query as string).split(' ');
		const lastToken = tokens[tokens.length - 1];
		const searchResponses = await Promise.all([
			getGlobalSearchResults(lastToken as string, 'tags'),
			getGlobalSearchResults(lastToken as string, 'artists'),
		]);

		if (searchResponses.some((searchResponse) => !searchResponse.ok)) {
			return;
		}

		const tagResponseData: TApiResponse<TAppSearchResult> = await searchResponses[0].json();
		const artistResponseData: TApiResponse<TAppSearchResult> = await searchResponses[1].json();

		labelSearchResults = {
			tags: tagResponseData.data.tags ?? [],
			artists: artistResponseData.data.artists ?? [],
		};
	}, SEARCH_DEBOUNCE_TIMEOUT_MS);
</script>

<svelte:head>
	<title>Dexbooru - Anime/Manga Imageboard</title>
	<meta property="og:title" content="Dexbooru - Anime/Manga Imageboard" />
	<meta
		property="og:description"
		content="Dexbooru is an anime and manga imageboard. Search for your favorite anime and manga images across {formatNumberWithCommas(
			postCount,
		)} posts, {formatNumberWithCommas(tagCount)} unique tags and {formatNumberWithCommas(
			artistCount,
		)} unique artists."
	/>
	<meta property="og:image" content={ApplicationLogo} />
</svelte:head>

<main class="flex flex-col items-center justify-center text-center mt-40">
	<h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
		Dexbooru - Anime/Manga Imageboard
	</h1>
	<form action="/search" method="GET" class="w-full flex flex-col items-center relative">
		<Searchbar
			width="50%"
			required
			name="query"
			autofocus
			inputElementId="advanced-searchbar"
			placeholder="example: tag1 -tag2 artist1 -artist2 uploader:bobby views:>1000 likes:<100"
			queryInputHandler={handleSearchbarInput}
			queryInputClear={() => (labelSearchResults = { tags: [], artists: [] })}
			customClass="w-1/2 min-w-[300px]"
		/>
		<SearchResultsDropdown results={labelSearchResults} />
	</form>
	<p class="text-md text-gray-700 dark:text-gray-300 mt-6">
		Serving <span>{formatNumberWithCommas(postCount)} posts</span>,
		<span>{formatNumberWithCommas(tagCount)} tags</span>,
		<span>{formatNumberWithCommas(artistCount)} artists</span>,
		<span>{formatNumberWithCommas(collectionCount)} collections</span>, and
		<span>{formatNumberWithCommas(userCount)} users</span>.
	</p>
</main>
