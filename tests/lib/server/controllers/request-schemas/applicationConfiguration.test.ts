import { describe, expect, it } from 'vitest';
import { ApplicationConfigurationUpdateSchema } from '$lib/server/controllers/request-schemas/applicationConfiguration';

describe('application configuration update schema', () => {
	it('dedupes known SauceNAO index ids', () => {
		const result = ApplicationConfigurationUpdateSchema.body.safeParse({
			sauceNaoEnabledIndexes: [5, 5, 9],
		});

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.sauceNaoEnabledIndexes).toEqual([5, 9]);
	});

	it('rejects an unknown SauceNAO index id', () => {
		const result = ApplicationConfigurationUpdateSchema.body.safeParse({
			sauceNaoEnabledIndexes: [17],
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.error.issues.map((issue) => issue.message)).toEqual([
			'Unknown SauceNAO index id: 17',
		]);
	});

	it('rejects similarity outside 1..100 and accepts an empty index list', () => {
		const high = ApplicationConfigurationUpdateSchema.body.safeParse({
			sauceNaoMinimumSimilarity: 101,
		});
		const empty = ApplicationConfigurationUpdateSchema.body.safeParse({
			sauceNaoEnabledIndexes: [],
			sauceNaoMinimumSimilarity: 1,
		});

		expect(high.success).toBe(false);
		expect(empty.success).toBe(true);
		if (!empty.success) return;
		expect(empty.data).toEqual({
			sauceNaoEnabledIndexes: [],
			sauceNaoMinimumSimilarity: 1,
		});
	});
});
