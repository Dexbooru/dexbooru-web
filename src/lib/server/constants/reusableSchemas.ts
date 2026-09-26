import { z } from 'zod';

const BoolStrValueSchema = z
	.union([z.literal('true'), z.literal('false'), z.literal('on'), z.literal('off'), z.boolean()])
	.transform((val) => {
		if (typeof val === 'string') {
			if (val === 'on') return true;
			if (val === 'off') return false;
			return val === 'true';
		}

		return val;
	});

/** Parses form bool strings; defaults to false when omitted (checkbox-style fields). */
export const BoolStrSchema = BoolStrValueSchema.optional().default(false);

/** Parses form bool strings; leaves undefined when omitted (partial updates). */
export const OptionalBoolStrSchema = BoolStrValueSchema.optional();

export const PageNumberSchema = z
	.string()
	.optional()
	.default('0')
	.transform((val) => parseInt(val, 10))
	.refine((val) => !isNaN(val), { message: 'Invalid pageNumber, must be a number' });
