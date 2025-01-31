import type { TRequestSchema } from '$lib/server/types/controllers';
import { z } from 'zod';

const CreateFriendRequestSchema = {
	pathParams: z.object({
		username: z.string(),
	}),
} satisfies TRequestSchema;

const DeleteFriendRequestSchema = {
	pathParams: z.object({
		username: z.string(),
	}),
	urlSearchParams: z.object({
		action: z.union([z.literal('accept'), z.literal('reject')]),
	}),
} satisfies TRequestSchema;

const DeleteFriendSchema = {
	pathParams: z.object({
		username: z.string(),
	}),
} satisfies TRequestSchema;

export { CreateFriendRequestSchema, DeleteFriendRequestSchema, DeleteFriendSchema };
