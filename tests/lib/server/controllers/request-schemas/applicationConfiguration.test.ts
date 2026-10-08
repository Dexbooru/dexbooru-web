import { describe, expect, it } from 'vitest';
import { ApplicationConfigurationUpdateSchema } from '$lib/server/controllers/request-schemas/applicationConfiguration';

describe('application configuration update schema', () => {
	it('accepts sauceNao similarity from 1 through 100', () => {
		const low = ApplicationConfigurationUpdateSchema.body.safeParse({
			sauceNaoMinimumSimilarity: 1,
		});
		const high = ApplicationConfigurationUpdateSchema.body.safeParse({
			sauceNaoMinimumSimilarity: 100,
		});

		expect(low.success).toBe(true);
		expect(high.success).toBe(true);
		if (!low.success || !high.success) return;
		expect(low.data.sauceNaoMinimumSimilarity).toBe(1);
		expect(high.data.sauceNaoMinimumSimilarity).toBe(100);
	});

	it('rejects sauceNao similarity outside 1..100', () => {
		const low = ApplicationConfigurationUpdateSchema.body.safeParse({
			sauceNaoMinimumSimilarity: 0,
		});
		const high = ApplicationConfigurationUpdateSchema.body.safeParse({
			sauceNaoMinimumSimilarity: 101,
		});

		expect(low.success).toBe(false);
		expect(high.success).toBe(false);
	});
});
