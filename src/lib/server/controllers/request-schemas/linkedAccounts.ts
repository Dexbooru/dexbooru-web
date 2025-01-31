import { BoolStrSchema } from '$lib/server/constants/reusableSchemas';
import type { TRequestSchema } from '$lib/server/types/controllers';
import type { UserAuthenticationSource } from '@prisma/client';
import { z } from 'zod';

const GetUserLinkedAccountsSchema = {
	pathParams: z.object({
		username: z.string().min(1, { message: 'Username is required' }),
	}),
} satisfies TRequestSchema;

const UpdateUserLinkedAccountsSchema = {
	form: z.object({
		disconnectedLinkedAccounts: z
			.string()
			.transform(
				(value) =>
					value
						.split(',')
						.filter((platform) =>
							['GOOGLE', 'GITHUB', 'DISCORD'].includes(platform),
						) as UserAuthenticationSource[],
			),
		isGooglePublic: BoolStrSchema,
		isGithubPublic: BoolStrSchema,
		isDiscordPublic: BoolStrSchema,
	}),
} satisfies TRequestSchema;

export { GetUserLinkedAccountsSchema, UpdateUserLinkedAccountsSchema };
