import { handleGetAnimeSearchResults } from '$lib/server/controllers/anime';
import type { TJikanAnimeSearchResponse } from '$lib/server/helpers/jikan';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const response = (await handleGetAnimeSearchResults(event, 'page-server-load')) as
		| (TJikanAnimeSearchResponse & { transformedTitle: string })
		| null;

	return {
		animeData: response,
		title: event.params.title,
	};
};
