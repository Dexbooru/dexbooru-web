import { describe, expect, it } from 'vitest';
import {
	buildDefaultApplicationConfiguration,
	flattenApplicationConfigurationYaml,
	nestApplicationConfiguration,
} from '$lib/shared/applicationConfiguration';

describe('application configuration YAML helpers', () => {
	it('flattens nested YAML sections into flat configuration keys', () => {
		const flattened = flattenApplicationConfigurationYaml({
			labels: {
				maximumTagLength: 120,
			},
			posts: {
				maximumTagsPerPost: 30,
				maximumPostDescriptionLength: 900,
			},
			rateLimit: {
				likePostRateLimitMax: 20,
			},
		});

		expect(flattened.maximumTagLength).toBe(120);
		expect(flattened.maximumTagsPerPost).toBe(30);
		expect(flattened.maximumPostDescriptionLength).toBe(900);
		expect(flattened.likePostRateLimitMax).toBe(20);
	});

	it('throws for unknown section keys', () => {
		const invalidYaml = {
			invalid: { foo: 1 },
		};
		expect(() =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			flattenApplicationConfigurationYaml(invalidYaml as any),
		).toThrow('Unknown application configuration section');
	});

	it('throws for unknown nested keys', () => {
		const invalidYaml = {
			labels: {
				foo: 99,
			},
		};
		expect(() =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			flattenApplicationConfigurationYaml(invalidYaml as any),
		).toThrow('Unknown key "foo"');
	});

	it('nests a flat runtime configuration into sectioned keys', () => {
		const nested = nestApplicationConfiguration(buildDefaultApplicationConfiguration());

		expect(nested.labels.maximumTagLength).toBe(75);
		expect(nested.posts.maximumTagsPerPost).toBe(20);
		expect(nested.comments.maximumCommentContentLength).toBe(1500);
		expect(nested.rateLimit.likePostRateLimitWindowMs).toBe(60_000);
		expect(nested.sauceNao.sauceNaoMinimumSimilarity).toBe(70);
		expect(nested.sauceNao.sauceNaoEnabledIndexes).toEqual([
			5, 6, 8, 9, 11, 12, 25, 26, 27, 28, 34, 39, 41, 44,
		]);
	});

	it('parses sauceNao indexes and similarity', () => {
		const flattened = flattenApplicationConfigurationYaml({
			sauceNao: {
				sauceNaoEnabledIndexes: [5, 5, 9],
				sauceNaoMinimumSimilarity: 82.5,
			},
		});

		expect(flattened.sauceNaoEnabledIndexes).toEqual([5, 9]);
		expect(flattened.sauceNaoMinimumSimilarity).toBe(82.5);
	});

	it('rejects unknown sauceNao index ids', () => {
		expect(() =>
			flattenApplicationConfigurationYaml({
				sauceNao: { sauceNaoEnabledIndexes: [17] },
			}),
		).toThrow('Unknown SauceNAO index id: 17');
	});

	it('rejects sauceNao similarity outside 1..100', () => {
		expect(() =>
			flattenApplicationConfigurationYaml({
				sauceNao: { sauceNaoMinimumSimilarity: 101 },
			}),
		).toThrow('"sauceNao.sauceNaoMinimumSimilarity" must be between 1 and 100.');
	});

	it('rejects a non-array sauceNao index list', () => {
		expect(() =>
			flattenApplicationConfigurationYaml({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				sauceNao: { sauceNaoEnabledIndexes: 5 as any },
			}),
		).toThrow('Expected an array of SauceNAO index ids');
	});

	it('rejects non-numeric values for numeric keys', () => {
		expect(() =>
			flattenApplicationConfigurationYaml({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				labels: { maximumTagLength: '12' as any },
			}),
		).toThrow('Expected a number, received string');
	});
});
