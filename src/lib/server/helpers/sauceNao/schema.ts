import { z } from 'zod';

export const SauceNaoResultSchema = z.object({
	header: z.object({
		similarity: z.string(),
		thumbnail: z.string(),
		index_id: z.number(),
		index_name: z.string(),
	}),
	data: z.record(z.string(), z.unknown()),
});

export const SauceNaoResponseSchema = z.object({
	header: z.object({
		status: z.number(),
		short_remaining: z.number().optional(),
		long_remaining: z.number().optional(),
		message: z.string().optional(),
	}),
	results: z.array(SauceNaoResultSchema).optional(),
});

export const CachedSauceNaoMatchesSchema = z.array(
	z.object({
		indexId: z.number(),
		indexName: z.string(),
		similarity: z.number(),
		thumbnailUrl: z.string(),
		title: z.string().nullable(),
		sourceUrls: z.array(z.string()),
		artists: z.array(z.string()),
		characters: z.array(z.string()),
		series: z.array(z.string()),
	}),
);

export type TSauceNaoResult = z.infer<typeof SauceNaoResultSchema>;
