import {
	searchAllSections,
	searchForArtists,
	searchForPosts,
	searchForTags,
	searchForUsers
} from '$lib/server/db/actions/search';
import { DEFAULT_RESULTS_LIMIT, VALID_SEARCH_SECTIONS } from '$lib/shared/constants/search';
import { getUrlFields } from '$lib/shared/helpers/urls';
import type { IAppSearchParams, IAppSearchResult, TSearchSection } from '$lib/shared/types/search';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const { query, limit, searchSection }: IAppSearchParams = getUrlFields<IAppSearchParams>(
		url.searchParams
	);

	if (!query || !searchSection || !VALID_SEARCH_SECTIONS.includes(searchSection)) {
		throw error(400, { message: 'At least one of the required fields was missing!' });
	}

	const finalLimit = limit ? limit : DEFAULT_RESULTS_LIMIT;
	const finalSearchSection: TSearchSection = searchSection ? searchSection : 'all';
	const normalizedQuery = query.toLocaleLowerCase().trim();

	let finalSearchResults: IAppSearchResult | null = null;

	switch (finalSearchSection) {
		case 'all':
			finalSearchResults = await searchAllSections(normalizedQuery, finalLimit);
			break;
		case 'artists':
			finalSearchResults = await searchForArtists(normalizedQuery, finalLimit);
			break;
		case 'tags':
			finalSearchResults = await searchForTags(normalizedQuery, finalLimit);
			break;
		case 'users':
			finalSearchResults = await searchForUsers(normalizedQuery, finalLimit);
			break;
		case 'posts':
			finalSearchResults = await searchForPosts(normalizedQuery, finalLimit);
			break;
	}

	return new Response(JSON.stringify(finalSearchResults));
};
