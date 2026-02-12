import { MAXIMUM_POSTS_PER_COLLECTION } from '$lib/shared/constants/collections';
import {
	addPostToCollection,
	findCollectionsFromIds,
	removePostFromCollection,
} from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { getRemoteAssociatedKeys, invalidateMultipleCachesRemotely } from '../../helpers/sessions';
import {
	getCacheKeyForIndividualCollection,
	getCacheKeyForIndividualCollectionKeys,
} from '../cache-strategies/collections';
import { UpdateCollectionsPostsSchema } from '../request-schemas/collections';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';

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
