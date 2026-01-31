import type { TRequestSchema } from '$lib/server/types/controllers';
import { z } from 'zod';
import { PageNumberSchema } from '$lib/server/constants/reusableSchemas';

const AnimeSearchSchema = {
	pathParams: z.object({
		title: z.string().min(1, 'The anime title is required'),
	}),
	urlSearchParams: z.object({
		page: PageNumberSchema,
		limit: z
			.string()
			.optional()
			.default('12')
			.transform((val) => parseInt(val, 10))
			.refine((val) => !isNaN(val), { message: 'Invalid limit, must be a number' }),
	}),
} satisfies TRequestSchema;

export { AnimeSearchSchema };
