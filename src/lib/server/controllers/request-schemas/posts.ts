import { BoolStrSchema, PageNumberSchema } from '$lib/server/constants/reusableSchemas';
import type { TRequestSchema } from '$lib/server/types/controllers';
import {
	MAXIMUM_IMAGES_PER_POST,
	MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB,
} from '$lib/shared/constants/images';
import { MAXIMUM_ARTISTS_PER_POST, MAXIMUM_TAGS_PER_POST } from '$lib/shared/constants/posts';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import { isLabelAppropriate, transformLabels } from '$lib/shared/helpers/labels';
import { z } from 'zod';

const PostPaginationSchema = z.object({
	category: z
		.union([z.literal('general'), z.literal('liked'), z.literal('uploaded')])
		.default('general'),
	ascending: BoolStrSchema,
	orderBy: z
		.union([
			z.literal('views'),
			z.literal('likes'),
			z.literal('createdAt'),
			z.literal('updatedAt'),
			z.literal('commentCount'),
		])
		.default('createdAt'),
	pageNumber: PageNumberSchema,
});

const DescriptionSchema = z
	.string()
	.min(1, 'The description must be at least a single character long')
	.refine((val) => isLabelAppropriate(val, 'postDescription'), {
		message: 'The provided description was not appropriate',
	});

const GetPostsByAuthorSchema = {
	pathParams: z.object({
		username: z.string(),
	}),
	urlSearchParams: PostPaginationSchema,
} satisfies TRequestSchema;

const GetPostSchema = {
	urlSearchParams: z.object({
		uploadedSuccessfully: z.string().optional(),
	}),
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const GetPostsSchema = {
	urlSearchParams: z
		.object({
			userId: z.string().uuid().optional(),
		})
		.merge(PostPaginationSchema),
} satisfies TRequestSchema;

const DeletePostSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const LikePostSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		action: z.union([z.literal('like'), z.literal('dislike')]),
	}),
} satisfies TRequestSchema;

const GetPostsWithTagNameSchema = {
	pathParams: z.object({
		name: z.string().min(1, 'The tag name needs to be least one character long'),
	}),
	urlSearchParams: PostPaginationSchema,
} satisfies TRequestSchema;

const GetPostsWithArtistNameSchema = {
	pathParams: z.object({
		name: z.string().min(1, 'The tag name needs to be least one character long'),
	}),
	urlSearchParams: PostPaginationSchema,
} satisfies TRequestSchema;

const CreatePostSchema = {
	form: z.object({
		sourceLink: z.string().url(),
		description: DescriptionSchema,
		postPictures: z
			.union([z.instanceof(globalThis.File), z.array(z.instanceof(globalThis.File))])
			.transform((val) => Array.from(val instanceof File ? [val] : val))
			.refine(
				(val) => {
					if (val.length > MAXIMUM_IMAGES_PER_POST) return false;
					return !val.some((file) => !isFileImage(file) || !isFileImageSmall(file, 'post'));
				},
				{
					message: `At least one of the uploaded post picture was not an image format, exceeded the maximum size of ${MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB} or the total number of images exceeded the maximum allowed size per post of ${MAXIMUM_IMAGES_PER_POST}`,
				},
			),
		isNsfw: BoolStrSchema,
		tags: z
			.string()
			.min(1, 'The comma-seperated tag string must be at least a single character long')
			.transform((val) => {
				return transformLabels(val.split(','));
			})
			.refine(
				(val) => {
					if (val.length > MAXIMUM_TAGS_PER_POST) return false;
					return !val.some((tag) => !isLabelAppropriate(tag, 'tag'));
				},
				{
					message:
						'At least one of the providedd tags did not meet requirements and was not appropriate',
				},
			),
		artists: z
			.string()
			.min(1, 'The comma-seperated artist string must be at least a single character long')
			.transform((val) => {
				return transformLabels(val.split(','));
			})
			.refine(
				(val) => {
					if (val.length > MAXIMUM_ARTISTS_PER_POST) return false;
					return !val.some((artist) => !isLabelAppropriate(artist, 'artist'));
				},
				{
					message:
						'At least one of the providedd artists did not meet requirements and was not appropriate',
				},
			),
		uploadId: z.string().uuid().optional(),
		ignoreDuplicates: BoolStrSchema.optional().default('false'),
	}),
} satisfies TRequestSchema;

const GetSimilarPostsSchema = {
	form: z.object({
		postId: z.string().uuid().optional(),
		imageUrl: z.string().url().optional(),
		imageFile: z.string().optional(),
	}),
} satisfies TRequestSchema;

const PostUpdateSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		description: DescriptionSchema.optional(),
		deletionPostImageUrls: z.array(z.string().url()).optional(),
		newPostImagesContent: z.array(z.string()).optional(),
		sourceLink: z.string().url().optional(),
	}),
} satisfies TRequestSchema;

const CheckDuplicatePostsSchema = {
	body: z.object({
		hashes: z.array(z.string()),
	}),
} satisfies TRequestSchema;

export {
	CheckDuplicatePostsSchema,
	CreatePostSchema,
	DeletePostSchema,
	GetPostsByAuthorSchema,
	GetPostSchema,
	GetPostsSchema,
	GetPostsWithArtistNameSchema,
	GetPostsWithTagNameSchema,
	GetSimilarPostsSchema,
	LikePostSchema,
	PostUpdateSchema,
};
