import { describe, expect, it } from 'vitest';
import { SauceNaoIndexesUpdateSchema } from '$lib/server/controllers/request-schemas/sauceNao';

describe('SauceNAO index update schema', () => {
	it('accepts an array of integer index ids', () => {
		const result = SauceNaoIndexesUpdateSchema.body.safeParse({ enabledIndexIds: [5, 9] });

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.enabledIndexIds).toEqual([5, 9]);
	});

	it('rejects a non-integer index id', () => {
		const result = SauceNaoIndexesUpdateSchema.body.safeParse({ enabledIndexIds: [1.5] });

		expect(result.success).toBe(false);
	});
});
