import { z } from 'zod';

export const boolStrSchema = z
	.union([z.literal('true'), z.literal('false'), z.literal('on'), z.literal('off'), z.boolean()])
	.optional()
	.default('false')
	.transform((val) => {
		if (typeof val === 'string') {
			if (val === 'on') return true;
			if (val === 'off') return false;
			return val === 'true';
		}

		return val;
	});

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
		.union([
			z.literal('views'),
			z.literal('likes'),
			z.literal('createdAt'),
			z.literal('commentCount'),
		])
		.default('createdAt'),
	pageNumber: pageNumberSchema,
});
