import { PageNumberSchema } from '$lib/server/constants/reusableSchemas';
import type { TRequestSchema } from '$lib/server/types/controllers';
import { MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH } from '$lib/shared/constants/reports';
import { z } from 'zod';
import { ModerationReviewStatusSchema } from './moderation';

const UserReportCategorySchema = z.enum([
	'NSFW_PROFILE_PICTURE',
	'INAPPROPRIATE_USERNAME',
	'OTHER',
]);

const DeleteUserReportSchema = {
	pathParams: z.object({
		username: z.string().min(1, 'Username must be at least 1 character long'),
	}),
	urlSearchParams: z.object({
		reportId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const GetUserReportsSchema = {
	pathParams: z.object({
		username: z.string().min(1, 'Username must be at least 1 character long'),
	}),
} satisfies TRequestSchema;

const CreateUserReportSchema = {
	pathParams: z.object({
		username: z.string().min(1, 'Username must be at least 1 character long'),
	}),
	body: z.object({
		description: z.string().max(MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH).optional(),
		category: UserReportCategorySchema,
	}),
} satisfies TRequestSchema;

const GetUsersReportsSchema = {
	urlSearchParams: z.object({
		pageNumber: PageNumberSchema,
		category: UserReportCategorySchema.optional(),
		reviewStatus: ModerationReviewStatusSchema.optional().default('NOT_REVIEWED'),
	}),
} satisfies TRequestSchema;

const UpdateUserReportStatusSchema = {
	pathParams: z.object({
		reportId: z.string().uuid(),
	}),
	body: z.object({
		reviewStatus: ModerationReviewStatusSchema,
	}),
} satisfies TRequestSchema;

export {
	CreateUserReportSchema,
	DeleteUserReportSchema,
	GetUserReportsSchema,
	GetUsersReportsSchema,
	UpdateUserReportStatusSchema,
};
