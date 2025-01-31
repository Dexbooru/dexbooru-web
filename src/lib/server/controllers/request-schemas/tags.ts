import { PageNumberSchema } from '$lib/server/constants/reusableSchemas';
import type { TRequestSchema } from '$lib/server/types/controllers';
import { z } from 'zod';

const GetTagsSchema = {
	pathParams: z.object({
		letter: z.string().length(1, 'The letter needs to be a single non-empty character'),
	}),
	urlSearchParams: z.object({
		pageNumber: PageNumberSchema,
	}),
} satisfies TRequestSchema;

export { GetTagsSchema };
