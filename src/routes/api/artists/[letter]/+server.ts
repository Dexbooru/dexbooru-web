import { ARTISTS_PAGINATION_CACHE_TIME_SECONDS } from '$lib/server/constants/sessions';
import { getArtistsWithStartingLetter } from '$lib/server/db/actions/artist';
import { processPageNumberFromParams } from '$lib/server/helpers/pagination';
import { cacheResponse } from '$lib/server/helpers/sessions';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
	const letter = params.letter;

	if (!letter || letter.length > 1) {
		throw error(400, { message: 'The tag letter should be a single character long!' });
	}

	const pageNumber = processPageNumberFromParams(url.searchParams);

	const artists = await getArtistsWithStartingLetter(letter, pageNumber);

	cacheResponse(setHeaders, ARTISTS_PAGINATION_CACHE_TIME_SECONDS);

	return new Response(JSON.stringify(artists));
};
