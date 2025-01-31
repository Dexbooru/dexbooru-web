import { z } from 'zod';

export const BoolStrSchema = z
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

export const PageNumberSchema = z
	.string()
	.optional()
	.default('0')
	.transform((val) => parseInt(val, 10))
	.refine((val) => !isNaN(val), { message: 'Invalid pageNumber, must be a number' });
