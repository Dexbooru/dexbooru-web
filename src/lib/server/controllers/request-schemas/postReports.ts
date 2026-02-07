import { PageNumberSchema } from '$lib/server/constants/reusableSchemas';
import type { TRequestSchema } from '$lib/server/types/controllers';
import { MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH } from '$lib/shared/constants/reports';
import { z } from 'zod';
import { ModerationReviewStatusSchema } from './moderation';

const PostReportCategorySchema = z.enum([
	'ILLEGAL',
	'IMPROPER_TAGGING',
	'INAPPROPRIATE',
	'OFF_TOPIC',
	'OTHER',
	'SPAM',
]);

const DeletePostReportSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	urlSearchParams: z.object({
		reportId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const GetPostReportsSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const CreatePostReportSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		description: z.string().max(MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH).optional(),
		category: PostReportCategorySchema,
	}),
} satisfies TRequestSchema;

const GetPostsReportsSchema = {
	urlSearchParams: z.object({
		pageNumber: PageNumberSchema,
		category: PostReportCategorySchema.optional(),
		reviewStatus: ModerationReviewStatusSchema.optional().default('NOT_REVIEWED'),
	}),
} satisfies TRequestSchema;

const UpdatePostReportStatusSchema = {
	pathParams: z.object({
		reportId: z.string().uuid(),
	}),
	body: z.object({
		reviewStatus: ModerationReviewStatusSchema,
	}),
} satisfies TRequestSchema;

export {
	CreatePostReportSchema,
	DeletePostReportSchema,
	GetPostReportsSchema,
	GetPostsReportsSchema,
	UpdatePostReportStatusSchema,
};
