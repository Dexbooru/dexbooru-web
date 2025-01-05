import { NULLABLE_USER } from '$lib/shared/constants/auth';
import {
	MAXIMUM_COLLECTION_DESCRIPTION_LENGTH,
	MAXIMUM_COLLECTION_TITLE_LENGTH,
	MAXIMUM_POSTS_PER_COLLECTION,
} from '$lib/shared/constants/collections';
import { MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB } from '$lib/shared/constants/images';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import { isLabelAppropriate } from '$lib/shared/helpers/labels';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';
import { isHttpError, isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { deleteBatchFromBucket, uploadBatchToBucket } from '../aws/actions/s3';
import { AWS_COLLECTION_PICTURE_BUCKET_NAME } from '../constants/aws';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../constants/collections';
import { PUBLIC_POST_SELECTORS } from '../constants/posts';
import { boolStrSchema, pageNumberSchema } from '../constants/reusableSchemas';
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
import type { TControllerHandlerVariant, TRequestSchema } from '../types/controllers';

const createCollectionFormErrorData = (errorData: Record<string, unknown>, message: string) => {
	return {
		...errorData,
		reason: message,
	};
};

const collectionPaginationSchema = z.object({
	pageNumber: pageNumberSchema,
	ascending: boolStrSchema,
	orderBy: z.union([z.literal('createdAt'), z.literal('updatedAt')]).default('createdAt'),
});

const collectionTitleSchema = z
	.string()
	.min(1, 'The title cannot be empty')
	.max(MAXIMUM_COLLECTION_TITLE_LENGTH, {
		message: `The maximum collection title length is ${MAXIMUM_COLLECTION_TITLE_LENGTH}`,
	})
	.refine((val) => isLabelAppropriate(val, 'collectionTitle'));
const collectionDescriptionSchema = z
	.string()
	.min(1, 'The description cannot be empty')
	.max(MAXIMUM_COLLECTION_DESCRIPTION_LENGTH, {
		message: `The maximum collection description length is ${MAXIMUM_COLLECTION_DESCRIPTION_LENGTH}`,
	})
	.refine((val) => isLabelAppropriate(val, 'collectionDescription'));

const GetCollectionSchema = {
	pathParams: z.object({
		collectionId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const GetCollectionsSchema = {
	urlSearchParams: collectionPaginationSchema,
} satisfies TRequestSchema;

const CreateCollectionSchema = {
	form: z.object({
		title: collectionTitleSchema,
		description: collectionDescriptionSchema,
		isNsfw: boolStrSchema,
		collectionThumbnail: z
			.instanceof(globalThis.File)
			.transform((val) => (val.size > 0 ? val : null))
			.refine(
				(val) => {
					if (val === null) return true;
					return isFileImageSmall(val, 'collection') && isFileImage(val);
				},
				{
					message: `The provided collection thumbnail exceeded the maximum size of ${MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB} mb`,
				},
			),
	}),
} satisfies TRequestSchema;

const UpdateCollectionSchema = {
	pathParams: z.object({
		collectionId: z.string().uuid(),
	}),
	body: z.object({
		title: collectionTitleSchema,
		description: collectionDescriptionSchema,
	}),
} satisfies TRequestSchema;

const DeleteCollectionSchema = {
	pathParams: z.object({
		collectionId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const GetUserCollectionsSchema = {
	pathParams: z.object({
		username: z.string().min(1, 'The username cannot be empty'),
	}),
	urlSearchParams: collectionPaginationSchema,
} satisfies TRequestSchema;

const GetAuthenticatedUserCollectionsSchema = {
	urlSearchParams: collectionPaginationSchema,
} satisfies TRequestSchema;

const UpdateCollectionsPostsSchema = {
	body: z.object({
		postId: z.string().uuid(),
		collectionActions: z.record(z.string().uuid(), z.enum(['add', 'delete'])),
	}),
} satisfies TRequestSchema;

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
				return createSuccessResponse(
					'api-route',
					'Successfully updated the collections posts',
					responseData,
				);
			} catch (error) {
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
		try {
			const collection = await findCollectionById(collectionId, {
				...PUBLIC_POST_COLLECTION_SELECTORS,
				posts: {
					select: PUBLIC_POST_SELECTORS,
				},
			});
			if (!collection) {
				return createErrorResponse(
					handlerType,
					404,
					`A collection with the id: ${collectionId} does not exist`,
				);
			}

			return createSuccessResponse(handlerType, 'Successfully fetched the collection', collection);
		} catch (error) {
			if (isHttpError(error)) throw error;
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

			try {
				if (user.id === NULLABLE_USER.id) {
					redirect(302, '/');
				}

				const userCollections = await findCollectionsByAuthorId(
					user.id,
					pageNumber,
					ascending,
					orderBy,
					PUBLIC_POST_COLLECTION_SELECTORS,
				);
				const responseData: TCollectionPaginationData = {
					collections: userCollections,
					pageNumber,
					ascending,
					orderBy,
				};

				return createSuccessResponse(
					'page-server-load',
					'Successfully fetched user collections',
					responseData,
				);
			} catch (error) {
				if (isRedirect(error)) throw error;
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

			try {
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
				const responseData: TCollectionPaginationData = {
					collections: userCollections,
					pageNumber,
					ascending,
					orderBy,
				};

				return createSuccessResponse(
					handlerType,
					'Successfully fetched user collections',
					responseData,
				);
			} catch {
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

		try {
			const collections = await findCollections(
				pageNumber,
				ascending,
				orderBy,
				PUBLIC_POST_COLLECTION_SELECTORS,
			);
			const responseData: TCollectionPaginationData = {
				collections,
				pageNumber,
				orderBy,
				ascending,
			};
			return createSuccessResponse(
				handlerType,
				'Successfully fetched paginated collections',
				responseData,
			);
		} catch {
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

				return createSuccessResponse('api-route', 'Successfully deleted the collection');
			} catch {
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
				return createSuccessResponse(
					'api-route',
					'Successfully edited the collection',
					updatedCollection,
				);
			} catch {
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

				return createSuccessResponse(
					handlerType,
					'Collection created successfully',
					{ newCollection },
					201,
				);
			} catch (error) {
				if (isRedirect(error)) throw error;

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
