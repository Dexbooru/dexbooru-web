import type { TRequestSchema } from '$lib/server/types/controllers';
import { z } from 'zod';

const GetPostSourcesSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

export { GetPostSourcesSchema };
