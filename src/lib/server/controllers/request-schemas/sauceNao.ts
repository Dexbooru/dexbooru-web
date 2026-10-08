import type { TRequestSchema } from '$lib/server/types/controllers';
import { z } from 'zod';

const SauceNaoIndexesGetSchema = {} satisfies TRequestSchema;

const SauceNaoIndexesUpdateSchema = {
	body: z.object({
		enabledIndexIds: z.array(z.number().int()),
	}),
} satisfies TRequestSchema;

export { SauceNaoIndexesGetSchema, SauceNaoIndexesUpdateSchema };
