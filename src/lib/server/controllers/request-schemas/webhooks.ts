import type { TRequestSchema } from '$lib/server/types/controllers';
import { POST_SOURCE_TYPES } from '$lib/shared/constants/posts';
import { z } from 'zod';

const PostClassificationResultsSchema = {
	body: z.object({
		results: z.array(z.object({
			postId: z.string().uuid(),
			characterName: z.string().min(1, 'Character name cannot be empty'),
			sourceTitle: z.string().min(1, 'Source title cannot be empty'),
			sourceType: z.enum(POST_SOURCE_TYPES),
		})),
	}),
} satisfies TRequestSchema;

export { PostClassificationResultsSchema };

