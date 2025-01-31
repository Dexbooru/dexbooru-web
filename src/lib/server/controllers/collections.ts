import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { MAXIMUM_POSTS_PER_COLLECTION } from '$lib/shared/constants/collections';
import type { TCollectionPaginationData, TPostCollection } from '$lib/shared/types/collections';
import { isHttpError, isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { deleteBatchFromBucket, uploadBatchToBucket } from '../aws/actions/s3';
import { AWS_COLLECTION_PICTURE_BUCKET_NAME } from '../constants/aws';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../constants/collections';
import { PAGE_SERVER_LOAD_POST_SELECTORS, PUBLIC_POST_SELECTORS } from '../constants/posts';
import {
	addPostToCollection,
	createCollection,
	deleteCollectionById,
	findCollectionById,
	findCollections,
	findCollectionsByAuthorId,
	findCollectionsFromIds,
	removePostFromCollection,
	updateCollection,
} from '../db/actions/collection';
import { findUserByName } from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import { applyCollectionImageTransformationPipeline, flattenImageBuffers } from '../helpers/images';
import {
	cacheMultipleToCollectionRemotely,
	cacheResponseRemotely,
	getRemoteAssociatedKeys,
	getRemoteResponseFromCache,
	invalidateCacheRemotely,
	invalidateMultipleCachesRemotely,
} from '../helpers/sessions';
import logger from '../logging/logger';
import type { TControllerHandlerVariant } from '../types/controllers';
import {
	CACHE_TIME_AUTHOR_COLLECTIONS,
	CACHE_TIME_COLLECTION_GENERAL,
	CACHE_TIME_INDIVIDUAL_COLLECTION,
	getCacheKeyForAuthorCollections,
	getCacheKeyForGeneralCollectionPagination,
	getCacheKeyForIndividualCollection,
	getCacheKeyForIndividualCollectionKeys,
} from './cache-strategies/collections';
import {
	CreateCollectionSchema,
	DeleteCollectionSchema,
	GetAuthenticatedUserCollectionsSchema,
	GetCollectionSchema,
	GetCollectionsSchema,
	GetUserCollectionsSchema,
	UpdateCollectionSchema,
	UpdateCollectionsPostsSchema,
} from './request-schemas/collections';

const createCollectionFormErrorData = (errorData: Record<string, unknown>, message: string) => {
	return {
		...errorData,
		reason: message,
	};
};

export const handleUpdateCollectionsPosts = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UpdateCollectionsPostsSchema,
		async (data) => {
			const user = event.locals.user;
			const { postId, collectionActions } = data.body;
			const collectionIds = Object.keys(collectionActions);

			try {
				const matchingCollections = await findCollectionsFromIds(collectionIds, {
					id: true,
					authorId: true,
					posts: {
						select: { id: true },
					},
				});
				if (matchingCollections.length !== collectionIds.length) {
					return createErrorResponse(
						'api-route',
						404,
						'At least one of the provided collection ids does not match to an existing collection',
					);
				}

				const userOwnedCollections = matchingCollections.filter(
					(collection) => collection.authorId === user.id,
				);
				if (userOwnedCollections.length !== collectionIds.length) {
					return createErrorResponse(
						'api-route',
						403,
						'At least one of the provided collection ids author does not match the authenticated user',
					);
				}

				const updateReport = new Map<string, string>();
				for (const [collectionId, action] of Object.entries(collectionActions)) {
					const matchingCollection = matchingCollections.find(
						(collection) => collection.id === collectionId,
					);
					const postCount = matchingCollection?.posts.length ?? 0;
					const postAlreadyExistsInCollection = matchingCollection?.posts.some(
						(post) => post.id === postId,
					);

					switch (action) {
						case 'add':
							if (postAlreadyExistsInCollection) {
								updateReport.set(
									collectionId,
									`No action taken: Post ${postId} already exists in collection ${collectionId}`,
								);
							} else if (postCount === MAXIMUM_POSTS_PER_COLLECTION) {
								updateReport.set(
									collectionId,
									`Failed to add post ${postId} to collection ${collectionId}: Maximum post limit of ${MAXIMUM_POSTS_PER_COLLECTION} reached`,
								);
							} else {
								const updatedCollection = await addPostToCollection(collectionId, postId);
								if (updatedCollection) {
									updateReport.set(
										collectionId,
										`Successfully added post ${postId} to collection ${collectionId}`,
									);
								} else {
									updateReport.set(
										collectionId,
										`Failed to add post ${postId} to collection ${collectionId}: An unexpected error occured at the database level`,
									);
								}
							}
							break;

						case 'delete':
							if (postCount === 0) {
								updateReport.set(
									collectionId,
									`Failed to remove post ${postId} from collection ${collectionId}: No posts to remove`,
								);
							} else {
								const updatedCollection = await removePostFromCollection(collectionId, postId);
								if (updatedCollection) {
									updateReport.set(
										collectionId,
										`Successfully removed post ${postId} from collection ${collectionId}`,
									);
								} else {
									updateReport.set(
										collectionId,
										`Failed to remove post ${postId} from collection ${collectionId}: An unexpected error occured at the database level`,
									);
								}
							}
							break;

						default:
							updateReport.set(
								collectionId,
								`Invalid action "${action}" for collection ${collectionId}. No changes were made`,
							);
							break;
					}
				}

				const responseData = Object.fromEntries(updateReport.entries());

				invalidateMultipleCachesRemotely(
					collectionIds.map((collectionId) => getCacheKeyForIndividualCollection(collectionId)),
				);

				collectionIds.forEach((collectionId) => {
					const associatedKey = getCacheKeyForIndividualCollectionKeys(collectionId);
					getRemoteAssociatedKeys(associatedKey).then((associatedCacheKeys) => {
						invalidateMultipleCachesRemotely(associatedCacheKeys);
					});
				});

				return createSuccessResponse(
					'api-route',
					'Successfully updated the collections posts',
					responseData,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to the collections posts',
				);
			}
		},
		true,
	);
};

export const handleGetCollection = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetCollectionSchema, async (data) => {
		const { collectionId } = data.pathParams;

		const cacheKey = getCacheKeyForIndividualCollection(collectionId);
		let finalCollection: TPostCollection;

		try {
			const cachedCollection = await getRemoteResponseFromCache<TPostCollection>(cacheKey);
			if (cachedCollection) {
				finalCollection = cachedCollection;
			} else {
				const collection = await findCollectionById(collectionId, {
					...PUBLIC_POST_COLLECTION_SELECTORS,
					posts: {
						select:
							handlerType === 'page-server-load'
								? PAGE_SERVER_LOAD_POST_SELECTORS
								: PUBLIC_POST_SELECTORS,
					},
				});
				if (!collection) {
					return createErrorResponse(
						handlerType,
						404,
						`A collection with the id: ${collectionId} does not exist`,
					);
				}

				collection.posts.forEach((post) => {
					post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
					post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));
				});

				finalCollection = collection;

				cacheResponseRemotely(cacheKey, finalCollection, CACHE_TIME_INDIVIDUAL_COLLECTION);
			}

			return createSuccessResponse(
				handlerType,
				'Successfully fetched the collection',
				finalCollection,
			);
		} catch (error) {
			if (isHttpError(error)) throw error;

			logger.error(error);

			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occured while fetching the collection',
			);
		}
	});
};

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

export const handleDeleteCollection = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeleteCollectionSchema,
		async (data) => {
			const collectionId = data.pathParams.collectionId;

			try {
				const collection = await findCollectionById(collectionId, {
					authorId: true,
					thumbnailImageUrls: true,
				});
				if (!collection) {
					return createErrorResponse(
						'api-route',
						404,
						`A collection with the id: ${collectionId} does not exist`,
					);
				}

				if (collection.authorId !== event.locals.user.id) {
					return createErrorResponse(
						'api-route',
						403,
						`The user with the id: ${event.locals.user.id} is not the author of this collection`,
					);
				}

				await deleteCollectionById(collectionId, event.locals.user.id);
				if (collection.thumbnailImageUrls.length > 0) {
					await deleteBatchFromBucket(
						AWS_COLLECTION_PICTURE_BUCKET_NAME,
						collection.thumbnailImageUrls,
					);
				}

				const individualCacheKey = getCacheKeyForIndividualCollection(collectionId);
				const associatedCacheKey = getCacheKeyForIndividualCollectionKeys(collectionId);

				invalidateCacheRemotely(individualCacheKey);
				const associatedCacheKeys = await getRemoteAssociatedKeys(associatedCacheKey);
				invalidateMultipleCachesRemotely(associatedCacheKeys);

				return createSuccessResponse('api-route', 'Successfully deleted the collection');
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to delete the collection',
				);
			}
		},
		true,
	);
};

export const handleUpdateCollection = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UpdateCollectionSchema,
		async (data) => {
			const collectionId = data.pathParams.collectionId;
			const { title, description } = data.body;

			try {
				const collection = await findCollectionById(collectionId, { authorId: true });
				if (!collection) {
					return createErrorResponse(
						'api-route',
						404,
						`A collection with the id: ${collectionId} does not exist`,
					);
				}

				if (collection.authorId !== event.locals.user.id) {
					return createErrorResponse(
						'api-route',
						403,
						`The user with the id: ${event.locals.user.id} is not the author of this collection`,
					);
				}

				const updatedCollection = await updateCollection(collectionId, title, description);

				const cacheKey = getCacheKeyForIndividualCollection(collectionId);
				const associatedKey = getCacheKeyForIndividualCollectionKeys(collectionId);

				invalidateCacheRemotely(cacheKey);
				const associatedCacheKeys = await getRemoteAssociatedKeys(associatedKey);
				invalidateMultipleCachesRemotely(associatedCacheKeys);

				return createSuccessResponse(
					'api-route',
					'Successfully edited the collection',
					updatedCollection,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to edit the collection',
				);
			}
		},
		true,
	);
};

export const handleCreateCollection = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		CreateCollectionSchema,
		async (data) => {
			const { title, description, collectionThumbnail, isNsfw } = data.form;
			const errorData = {
				title,
				description,
				isNsfw,
			};

			let finalThumbnailImageUrls: string[] = [];
			let finalCollectionId: string | null = null;

			try {
				let thumbnailImageUrls: string[] = [];
				if (collectionThumbnail !== null) {
					const imageData = await applyCollectionImageTransformationPipeline(
						collectionThumbnail,
						isNsfw,
					);
					const { fileObjectIds, fileBuffers } = flattenImageBuffers([imageData]);
					thumbnailImageUrls = await uploadBatchToBucket(
						AWS_COLLECTION_PICTURE_BUCKET_NAME,
						'collections',
						fileBuffers,
						'webp',
						fileObjectIds,
					);
					finalThumbnailImageUrls = thumbnailImageUrls;
				}

				const newCollection = await createCollection({
					title,
					description,
					thumbnailImageUrls,
					isNsfw,
					authorId: event.locals.user.id,
				});
				finalCollectionId = newCollection.id;

				const cacheKey = getCacheKeyForGeneralCollectionPagination('createdAt', false, 0);
				invalidateCacheRemotely(cacheKey);

				return createSuccessResponse(
					handlerType,
					'Collection created successfully',
					{ newCollection },
					201,
				);
			} catch (error) {
				if (isRedirect(error)) throw error;

				logger.error(error);

				if (finalThumbnailImageUrls.length > 0) {
					deleteBatchFromBucket(AWS_COLLECTION_PICTURE_BUCKET_NAME, finalThumbnailImageUrls);
				}

				if (finalCollectionId) {
					deleteCollectionById(finalCollectionId, event.locals.user.id);
				}

				const message = 'An unexpected error occurred while creating the post';
				return createErrorResponse(
					handlerType,
					500,
					message,
					createCollectionFormErrorData(errorData, message),
				);
			}
		},
		true,
	);
};
