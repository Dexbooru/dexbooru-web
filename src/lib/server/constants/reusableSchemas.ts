import { z } from 'zod';

export const boolStrSchema = z
	.union([z.literal('true'), z.literal('false'), z.boolean()])
	.optional()
	.default('false')
	.transform((val) => (typeof val === 'string' ? val === 'true' : val));

export const pageNumberSchema = z
	.string()
	.optional()
	.default('0')
	.transform((val) => parseInt(val, 10))
	.refine((val) => !isNaN(val), { message: 'Invalid pageNumber, must be a number' });

export const postPaginationSchema = z.object({
	category: z
		.union([z.literal('general'), z.literal('liked'), z.literal('uploaded')])
		.default('general'),
	ascending: boolStrSchema,
	orderBy: z
		.union([z.literal('views'), z.literal('likes'), z.literal('createdAt')])
		.default('createdAt'),
	pageNumber: pageNumberSchema,
});
