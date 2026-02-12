import { findCollectionsByAuthorId } from '../../db/actions/collection';
import { findUserByName } from '../../db/actions/user';
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
	getCacheKeyForAuthorCollections,
	getCacheKeyForIndividualCollectionKeys,
	CACHE_TIME_AUTHOR_COLLECTIONS,
} from '../cache-strategies/collections';
import { GetUserCollectionsSchema } from '../request-schemas/collections';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';

export const handleGetUserCollections = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetUserCollectionsSchema,
		async (data) => {
			const username = data.pathParams.username;
			const { pageNumber, orderBy, ascending } = data.urlSearchParams;

			const cacheKey = getCacheKeyForAuthorCollections(username, orderBy, ascending, pageNumber);
			let finalResponseData: TCollectionPaginationData;

			try {
				const cachedResponseData =
					await getRemoteResponseFromCache<TCollectionPaginationData>(cacheKey);
				if (cachedResponseData) {
					finalResponseData = cachedResponseData;
				} else {
					const user = await findUserByName(username);
					if (!user) {
						return createErrorResponse(
							handlerType,
							404,
							`A username called ${username} does not exist`,
						);
					}

					const userCollections = await findCollectionsByAuthorId(
						user.id,
						pageNumber,
						ascending,
						orderBy,
						PUBLIC_POST_COLLECTION_SELECTORS,
					);

					finalResponseData = {
						collections: userCollections,
						pageNumber,
						ascending,
						orderBy,
					};

					cacheResponseRemotely(cacheKey, finalResponseData, CACHE_TIME_AUTHOR_COLLECTIONS);
					cacheMultipleToCollectionRemotely(
						finalResponseData.collections.map((collection) =>
							getCacheKeyForIndividualCollectionKeys(collection.id),
						),
						cacheKey,
					);
				}

				return createSuccessResponse(
					handlerType,
					'Successfully fetched user collections',
					finalResponseData,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error while fetching the user collections',
				);
			}
		},
	);
};
