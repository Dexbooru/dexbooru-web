import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { findCollectionsByAuthorId } from '../../db/actions/collection';
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
import { GetAuthenticatedUserCollectionsSchema } from '../request-schemas/collections';
import logger from '../../logging/logger';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';

export const handleGetAuthenticatedUserCollections = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		GetAuthenticatedUserCollectionsSchema,
		async (data) => {
			const user = event.locals.user;
			const { pageNumber, orderBy, ascending } = data.urlSearchParams;

			const cacheKey = getCacheKeyForAuthorCollections(user.id, orderBy, ascending, pageNumber);
			let finalResponseData: TCollectionPaginationData;

			try {
				if (user.id === NULLABLE_USER.id) {
					redirect(302, '/');
				}

				const cachedResponseData =
					await getRemoteResponseFromCache<TCollectionPaginationData>(cacheKey);
				if (cachedResponseData) {
					finalResponseData = cachedResponseData;
				} else {
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
					'page-server-load',
					'Successfully fetched user collections',
					finalResponseData,
				);
			} catch (error) {
				if (isRedirect(error)) throw error;

				logger.error(error);

				return createErrorResponse(
					'page-server-load',
					500,
					'An unexpected error occured while fetching the user collections',
				);
			}
		},
	);
};
