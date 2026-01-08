import { BoolStrSchema, PageNumberSchema } from '$lib/server/constants/reusableSchemas';
import type { TRequestSchema } from '$lib/server/types/controllers';
import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import { normalizeQuery } from '$lib/shared/helpers/search';
import { z } from 'zod';

const LimitSchema = z
	.string()
	.optional()
	.default(`${MAXIMUM_POSTS_PER_PAGE}`)
	.transform((val) => parseInt(val, 10))
	.refine((val) => !isNaN(val), { message: 'Invalid limit, must be a number' });

const AdvancedPostSearchResultsSchema = {
	urlSearchParams: z.object({
		query: z
			.string()
			.min(1, 'The query length needs to be least one character long')
			.transform((val) => {
				const tokens = val.trim().split(' ');
				return tokens.toSorted().join(' ');
			}),
		limit: LimitSchema,
		pageNumber: PageNumberSchema,
		orderBy: z
			.union([
				z.literal('views'),
				z.literal('likes'),
				z.literal('createdAt'),
				z.literal('updatedAt'),
				z.literal('commentCount'),
			])
			.default('createdAt'),
		ascending: BoolStrSchema,
	}),
} satisfies TRequestSchema;

const GetSearchResultsSchema = {
	urlSearchParams: z.object({
		query: z
			.string()
			.min(1, 'The query length needs to be least one character one long')
			.transform((val) => normalizeQuery(val)),
		limit: LimitSchema,
		searchSection: z
			.union([
				z.literal('posts'),
				z.literal('tags'),
				z.literal('artists'),
				z.literal('users'),
				z.literal('collections'),
				z.literal('all'),
			])
			.default('all'),
	}),
} satisfies TRequestSchema;

export { AdvancedPostSearchResultsSchema, GetSearchResultsSchema };
