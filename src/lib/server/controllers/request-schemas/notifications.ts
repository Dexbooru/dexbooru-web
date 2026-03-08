import type { TRequestSchema } from '$lib/server/types/controllers';
import z from 'zod';

const GetNotificationsSchema = {
	urlSearchParams: z.object({
		page: z
			.string()
			.optional()
			.default('1')
			.transform((val) => parseInt(val, 10))
			.refine((val) => !isNaN(val) && val >= 1, { message: 'Page must be at least 1' }),
		limit: z
			.string()
			.optional()
			.default('20')
			.transform((val) => parseInt(val, 10))
			.refine((val) => !isNaN(val) && val > 0 && val <= 100, {
				message: 'Limit must be between 1 and 100',
			}),
		read: z.enum(['true', 'false']).optional(),
	}),
} satisfies TRequestSchema;

export { GetNotificationsSchema };
