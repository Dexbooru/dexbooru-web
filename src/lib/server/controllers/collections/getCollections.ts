import type { TCollectionPaginationData } from '$lib/shared/types/collections';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../../constants/collections';
import { findCollections } from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import {
	CACHE_TIME_COLLECTION_GENERAL,
	getCacheKeyForGeneralCollectionPagination,
	getCacheKeyForIndividualCollectionKeys,
} from '../cache-strategies/collections';
import { GetCollectionsSchema } from '../request-schemas/collections';
import { withRemoteCache } from '../strategies/withRemoteCache';

export const handleGetCollections = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetCollectionsSchema, async (data) => {
		const { pageNumber, orderBy, ascending } = data.urlSearchParams;

		const cacheKey = getCacheKeyForGeneralCollectionPagination(orderBy, ascending, pageNumber);

		try {
			const responseData = await withRemoteCache<TCollectionPaginationData>({
				cacheKey,
				ttlSeconds: CACHE_TIME_COLLECTION_GENERAL,
				getAssociateKeys: (data) =>
					data.collections.map((collection) =>
						getCacheKeyForIndividualCollectionKeys(collection.id),
					),
				compute: async () => {
					const collections = await findCollections(
						pageNumber,
						ascending,
						orderBy,
						PUBLIC_POST_COLLECTION_SELECTORS,
					);

					return {
						collections,
						pageNumber,
						orderBy,
						ascending,
					};
				},
			});

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
