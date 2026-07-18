import { NULLABLE_USER } from '$lib/shared/constants/auth';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../../constants/collections';
import { findCollectionsByAuthorId } from '../../db/actions/collection';
import { findUserByName } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import {
	CACHE_TIME_AUTHOR_COLLECTIONS,
	getCacheKeyForAuthorCollections,
	getCacheKeyForIndividualCollectionKeys,
} from '../cache-strategies/collections';
import {
	GetAuthenticatedUserCollectionsSchema,
	GetUserCollectionsSchema,
} from '../request-schemas/collections';
import { withRemoteCache } from './withRemoteCache';

type TAuthorCollectionsResult = TCollectionPaginationData | { notFoundUsername: string };

const isNotFoundResult = (
	result: TAuthorCollectionsResult,
): result is { notFoundUsername: string } => {
	return 'notFoundUsername' in result;
};

const loadAuthorCollections = async (
	authorCacheKey: string,
	pageNumber: number,
	orderBy: TCollectionPaginationData['orderBy'],
	ascending: boolean,
	resolveAuthorId: () => Promise<string | null>,
): Promise<TAuthorCollectionsResult> => {
	const cacheKey = getCacheKeyForAuthorCollections(authorCacheKey, orderBy, ascending, pageNumber);

	return await withRemoteCache({
		cacheKey,
		ttlSeconds: CACHE_TIME_AUTHOR_COLLECTIONS,
		shouldCache: (result) => !isNotFoundResult(result),
		getAssociateKeys: (result) => {
			if (isNotFoundResult(result)) return [];
			return result.collections.map((collection) =>
				getCacheKeyForIndividualCollectionKeys(collection.id),
			);
		},
		compute: async () => {
			const authorId = await resolveAuthorId();
			if (!authorId) {
				return { notFoundUsername: authorCacheKey };
			}

			const userCollections = await findCollectionsByAuthorId(
				authorId,
				pageNumber,
				ascending,
				orderBy,
				PUBLIC_POST_COLLECTION_SELECTORS,
			);

			return {
				collections: userCollections,
				pageNumber,
				ascending,
				orderBy,
			};
		},
	});
};

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

			try {
				const finalResponseData = await loadAuthorCollections(
					username,
					pageNumber,
					orderBy,
					ascending,
					async () => {
						const user = await findUserByName(username);
						return user?.id ?? null;
					},
				);

				if (isNotFoundResult(finalResponseData)) {
					return createErrorResponse(
						handlerType,
						404,
						`A username called ${username} does not exist`,
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

export const handleGetAuthenticatedUserCollections = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		GetAuthenticatedUserCollectionsSchema,
		async (data) => {
			const user = event.locals.user;
			const { pageNumber, orderBy, ascending } = data.urlSearchParams;

			try {
				if (user.id === NULLABLE_USER.id) {
					redirect(302, '/');
				}

				const finalResponseData = await loadAuthorCollections(
					user.id,
					pageNumber,
					orderBy,
					ascending,
					async () => user.id,
				);

				if (isNotFoundResult(finalResponseData)) {
					return createErrorResponse(
						'page-server-load',
						404,
						`A username called ${user.id} does not exist`,
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
