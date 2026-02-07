import { PageNumberSchema } from '$lib/server/constants/reusableSchemas';
import type { TRequestSchema } from '$lib/server/types/controllers';
import { MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH } from '$lib/shared/constants/reports';
import { z } from 'zod';
import { ModerationReviewStatusSchema } from './moderation';

const PostCollectionCategorySchema = z.enum([
	'INAPPROPRIATE_TITLE',
	'INAPPROPRIATE_DESCRIPTION',
	'OTHER',
]);

const DeletePostCollectionReportSchema = {
	pathParams: z.object({
		collectionId: z.string().uuid(),
	}),
	urlSearchParams: z.object({
		reportId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const GetPostCollectionReportsSchema = {
	pathParams: z.object({
		collectionId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const CreatePostCollectionReportSchema = {
	pathParams: z.object({
		collectionId: z.string().uuid(),
	}),
	body: z.object({
		description: z.string().max(MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH).optional(),
		category: PostCollectionCategorySchema,
	}),
} satisfies TRequestSchema;

const GetPostCollectionsReportsSchema = {
	urlSearchParams: z.object({
		pageNumber: PageNumberSchema,
		category: PostCollectionCategorySchema.optional(),
		reviewStatus: ModerationReviewStatusSchema.optional().default('NOT_REVIEWED'),
	}),
} satisfies TRequestSchema;

const UpdatePostCollectionReportStatusSchema = {
	pathParams: z.object({
		reportId: z.string().uuid(),
	}),
	body: z.object({
		reviewStatus: ModerationReviewStatusSchema,
	}),
} satisfies TRequestSchema;

export {
	CreatePostCollectionReportSchema,
	DeletePostCollectionReportSchema,
	GetPostCollectionReportsSchema,
	GetPostCollectionsReportsSchema,
	UpdatePostCollectionReportStatusSchema,
};
