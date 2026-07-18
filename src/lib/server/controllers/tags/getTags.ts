import type { RequestEvent } from '@sveltejs/kit';
import { getTagsWithStartingLetter } from '../../db/actions/tag';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import {
	TAGS_PAGINATION_CACHE_TIME_SECONDS,
	getLabelLetterCacheKey,
} from '../cache-strategies/labels';
import { GetTagsSchema } from '../request-schemas/tags';
import { withRemoteCache } from '../strategies/withRemoteCache';

export const handleGetTags = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', GetTagsSchema, async (data) => {
		try {
			const letter = data.pathParams.letter;
			const pageNumber = data.urlSearchParams.pageNumber;
			const cacheKey = getLabelLetterCacheKey('tags', pageNumber, letter);

			const tags = await withRemoteCache({
				cacheKey,
				ttlSeconds: TAGS_PAGINATION_CACHE_TIME_SECONDS,
				compute: () => getTagsWithStartingLetter(letter, pageNumber),
			});

			return createSuccessResponse(
				'api-route',
				`Successfully fetched tags starting with the letter: ${letter} and on page number: ${pageNumber}`,
				tags,
			);
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				'api-route',
				500,
				'An unexpected error occured while fetching the tags',
			);
		}
	});
};
