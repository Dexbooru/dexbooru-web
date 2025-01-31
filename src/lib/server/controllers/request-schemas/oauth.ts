import type { TRequestSchema } from "$lib/server/types/controllers";
import { z } from "zod";

const OauthStoreSchema = {
	body: z.object({
		token: z.string().min(1, { message: 'Token is required' }),
	}),
} satisfies TRequestSchema;

const OauthCallbackSchema = {
	urlSearchParams: z.object({
		state: z.string().min(1, { message: 'State is required' }),
		code: z.string().min(1, { message: 'Code is required' }),
	}),
} satisfies TRequestSchema;

export { OauthCallbackSchema, OauthStoreSchema };
