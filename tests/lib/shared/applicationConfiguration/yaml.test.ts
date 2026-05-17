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
	});
});
