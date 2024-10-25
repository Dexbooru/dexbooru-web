import {
	MAXIMUM_COLLECTION_DESCRIPTION_LENGTH,
	MAXIMUM_COLLECTION_TITLE_LENGTH,
} from '$lib/shared/constants/collections';
import { MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB } from '$lib/shared/constants/images';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import { isLabelAppropriate } from '$lib/shared/helpers/labels';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { deleteBatchFromBucket, uploadBatchToBucket } from '../aws/actions/s3';
import { AWS_COLLECTION_PICTURE_BUCKET_NAME } from '../constants/aws';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../constants/collections';
import { boolStrSchema, pageNumberSchema } from '../constants/reusableSchemas';
import {
	createCollection,
	deleteCollection,
	findCollectionById,
	findCollections,
	findCollectionsByAuthorId,
	updateCollection,
} from '../db/actions/collection';
import { findUserByName } from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	isRedirectObject,
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

const GetCollectionsSchema = {
	urlSearchParams: z.object({
		pageNumber: pageNumberSchema,
	}),
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
	urlSearchParams: z.object({
		pageNumber: pageNumberSchema,
	}),
} satisfies TRequestSchema;

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
			const pageNumber = data.urlSearchParams.pageNumber;

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
					event.locals.user.id,
					pageNumber,
					PUBLIC_POST_COLLECTION_SELECTORS,
				);
				const responseData: TCollectionPaginationData = {
					collections: userCollections,
					pageNumber,
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
		const pageNumber = data.urlSearchParams.pageNumber;

		try {
			const collections = await findCollections(pageNumber, PUBLIC_POST_COLLECTION_SELECTORS);
			const responseData: TCollectionPaginationData = {
				collections,
				pageNumber,
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
						401,
						`The user with the id: ${event.locals.user.id} is not the author of this collection`,
					);
				}

				await deleteCollection(collectionId, event.locals.user.id);
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
						401,
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
				}

				const newCollection = await createCollection({
					title,
					description,
					thumbnailImageUrls,
					isNsfw,
					authorId: event.locals.user.id,
				});

				if (handlerType === 'form-action') {
					redirect(302, `/collections/${newCollection.id}?createdSuccessfully=true`);
				}

				return createSuccessResponse(
					handlerType,
					'Collection created successfully',
					{ newCollection },
					201,
				);
			} catch (error) {
				if (isRedirectObject(error)) throw error;
				console.log(error);
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
