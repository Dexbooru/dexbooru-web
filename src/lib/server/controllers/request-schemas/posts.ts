import { BoolStrSchema, PageNumberSchema } from '$lib/server/constants/reusableSchemas';
import { getApplicationConfigurationSync } from '$lib/server/applicationConfiguration';
import type { TRequestSchema } from '$lib/server/types/controllers';
import { MAXIMUM_POST_SOURCE_LABEL_LENGTH, POST_SOURCE_TYPES } from '$lib/shared/constants/posts';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import { isLabelAppropriate, transformLabel, transformLabels } from '$lib/shared/helpers/labels';
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

const createGetPostsByNameSchema = (label: string) =>
	({
		pathParams: z.object({
			name: z.string().min(1, `The ${label} name needs to be at least one character long`),
		}),
		urlSearchParams: PostPaginationSchema,
	}) satisfies TRequestSchema;

const GetPostsWithTagNameSchema = createGetPostsByNameSchema('tag');
const GetPostsWithArtistNameSchema = createGetPostsByNameSchema('artist');
const GetPostsWithCharacterNameSchema = createGetPostsByNameSchema('character');
const GetPostsWithSourceTitleSchema = createGetPostsByNameSchema('source');

const optionalPostSourceLabel = (label: string) =>
	z
		.string()
		.optional()
		.transform((value) => {
			if (value === undefined) return undefined;
			const normalized = transformLabel(value);
			return normalized.length === 0 ? undefined : normalized;
		})
		.refine(
			(value) =>
				value === undefined ||
				(value.length <= MAXIMUM_POST_SOURCE_LABEL_LENGTH && isLabelAppropriate(value, 'tag')),
			{ message: `The provided ${label} was not appropriate` },
		);

const optionalPostSourceType = z
	.union([z.literal(''), z.enum(POST_SOURCE_TYPES)])
	.optional()
	.transform((value) => (value === undefined || value === '' ? undefined : value));

const CreatePostSchema = {
	form: z.object({
		sourceLink: z.string().url(),
		description: DescriptionSchema,
		postPictures: z
			.union([z.instanceof(globalThis.File), z.array(z.instanceof(globalThis.File))])
			.transform((val) => Array.from(val instanceof File ? [val] : val))
			.refine(
				(val) => {
					const configuration = getApplicationConfigurationSync();
					if (val.length > configuration.maximumImagesPerPost) return false;
					return !val.some((file) => {
						const fileSizeMb = file.size / 1000 / 1000;
						return !isFileImage(file) || fileSizeMb > configuration.maximumPostImageUploadSizeMb;
					});
				},
				{
					message: `At least one of the uploaded post picture was not an image format, exceeded the maximum size of ${getApplicationConfigurationSync().maximumPostImageUploadSizeMb} or the total number of images exceeded the maximum allowed size per post of ${getApplicationConfigurationSync().maximumImagesPerPost}`,
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
					if (val.length > getApplicationConfigurationSync().maximumTagsPerPost) return false;
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
					if (val.length > getApplicationConfigurationSync().maximumArtistsPerPost) return false;
					return !val.some((artist) => !isLabelAppropriate(artist, 'artist'));
				},
				{
					message:
						'At least one of the providedd artists did not meet requirements and was not appropriate',
				},
			),
		uploadId: z.string().uuid().optional(),
		ignoreDuplicates: BoolStrSchema,
		characterName: optionalPostSourceLabel('character name'),
		sourceTitle: optionalPostSourceLabel('series name'),
		sourceType: optionalPostSourceType,
	}),
} satisfies TRequestSchema;

const GetSourceSuggestionsSchema = {
	form: z.object({
		image: z
			.instanceof(globalThis.File)
			.refine((file) => isFileImage(file) && isFileImageSmall(file, 'post'), {
				message: 'The uploaded image must be a supported image within the post upload size limit.',
			}),
	}),
} satisfies TRequestSchema;

const GetSimilarPostsSchema = {
	form: z.object({
		postId: z.string().uuid().optional(),
		imageUrl: z.string().url().optional(),
		imageFile: z.string().optional(),
		similarityDescription: z
			.string()
			.max(getApplicationConfigurationSync().maximumPostDescriptionLength)
			.optional()
			.transform((val) => (val && val.trim() ? val.trim() : undefined)),
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
	GetPostsWithCharacterNameSchema,
	GetPostsWithSourceTitleSchema,
	GetPostsWithTagNameSchema,
	GetSimilarPostsSchema,
	GetSourceSuggestionsSchema,
	LikePostSchema,
	PostUpdateSchema,
};
