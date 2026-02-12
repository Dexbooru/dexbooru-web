import { findCollections } from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import {
	cacheMultipleToCollectionRemotely,
	cacheResponseRemotely,
	getRemoteResponseFromCache,
} from '../../helpers/sessions';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../../constants/collections';
import {
	getCacheKeyForGeneralCollectionPagination,
	getCacheKeyForIndividualCollectionKeys,
	CACHE_TIME_COLLECTION_GENERAL,
} from '../cache-strategies/collections';
import { GetCollectionsSchema } from '../request-schemas/collections';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';

export const handleGetCollections = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetCollectionsSchema, async (data) => {
		const { pageNumber, orderBy, ascending } = data.urlSearchParams;

		const cacheKey = getCacheKeyForGeneralCollectionPagination(orderBy, ascending, pageNumber);
		let responseData: TCollectionPaginationData;

		try {
			const cachedResponseData =
				await getRemoteResponseFromCache<TCollectionPaginationData>(cacheKey);
			if (cachedResponseData) {
				responseData = cachedResponseData;
			} else {
				const collections = await findCollections(
					pageNumber,
					ascending,
					orderBy,
					PUBLIC_POST_COLLECTION_SELECTORS,
				);

				responseData = {
					collections,
					pageNumber,
					orderBy,
					ascending,
				};

				cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_COLLECTION_GENERAL);
				cacheMultipleToCollectionRemotely(
					collections.map((collection) => getCacheKeyForIndividualCollectionKeys(collection.id)),
					cacheKey,
				);
			}

			return createSuccessResponse(
				handlerType,
				'Successfully fetched paginated collections',
				responseData,
			);
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occured while fetching the collections',
			);
		}
	});
};
