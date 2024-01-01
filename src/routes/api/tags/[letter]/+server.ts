import { TAGS_PAGINATION_CACHE_TIME_SECONDS } from '$lib/server/constants/sessions';
import { getTagsWithStartingLetter } from '$lib/server/db/actions/tag';
import { processPageNumberFromParams } from '$lib/server/helpers/pagination';
import { cacheResponse } from '$lib/server/helpers/sessions';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
	const letter = params.letter;

	if (!letter || letter.length > 1) {
		throw error(400, { message: 'The tag letter should be a single character long!' });
	}

	const pageNumber = processPageNumberFromParams(url.searchParams);

	const tags = await getTagsWithStartingLetter(letter, pageNumber);

	cacheResponse(setHeaders, TAGS_PAGINATION_CACHE_TIME_SECONDS);

	return new Response(JSON.stringify(tags));
};
