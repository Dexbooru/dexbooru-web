import { PageNumberSchema, BoolStrSchema } from "$lib/server/constants/reusableSchemas";
import type { TRequestSchema } from "$lib/server/types/controllers";
import { MAXIMUM_COLLECTION_TITLE_LENGTH, MAXIMUM_COLLECTION_DESCRIPTION_LENGTH } from "$lib/shared/constants/collections";
import { MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB } from "$lib/shared/constants/images";
import { isFileImageSmall, isFileImage } from "$lib/shared/helpers/images";
import { isLabelAppropriate } from "$lib/shared/helpers/labels";
import { z } from "zod";

const CollectionPaginationSchema = z.object({
	pageNumber: PageNumberSchema,
	ascending: BoolStrSchema,
	orderBy: z.union([z.literal('createdAt'), z.literal('updatedAt')]).default('createdAt'),
});

const CollectionTitleSchema = z
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
	urlSearchParams: CollectionPaginationSchema,
} satisfies TRequestSchema;

const CreateCollectionSchema = {
	form: z.object({
		title: CollectionTitleSchema,
		description: collectionDescriptionSchema,
		isNsfw: BoolStrSchema,
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
		title: CollectionTitleSchema,
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
	urlSearchParams: CollectionPaginationSchema,
} satisfies TRequestSchema;

const GetAuthenticatedUserCollectionsSchema = {
	urlSearchParams: CollectionPaginationSchema,
} satisfies TRequestSchema;

const UpdateCollectionsPostsSchema = {
	body: z.object({
		postId: z.string().uuid(),
		collectionActions: z.record(z.string().uuid(), z.enum(['add', 'delete'])),
	}),
} satisfies TRequestSchema;

export {
	CreateCollectionSchema,
	DeleteCollectionSchema,
	GetAuthenticatedUserCollectionsSchema,
	GetCollectionSchema,
	GetCollectionsSchema,
	GetUserCollectionsSchema,
	UpdateCollectionSchema,
	UpdateCollectionsPostsSchema,
};
