import type { TRequestSchema } from '$lib/server/types/controllers';
import { MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH } from '$lib/shared/constants/reports';
import { z } from 'zod';

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
		category: z.enum([
			'ILLEGAL',
			'IMPROPER_TAGGING',
			'INAPPROPRIATE',
			'OFF_TOPIC',
			'OTHER',
			'SPAM',
		]),
	}),
} satisfies TRequestSchema;

export { CreatePostReportSchema, DeletePostReportSchema, GetPostReportsSchema };
