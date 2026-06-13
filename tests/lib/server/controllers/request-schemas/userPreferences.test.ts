import { describe, it, expect } from 'vitest';
import { UpdateUserUserInterfacePreferencesSchema } from '$lib/server/controllers/request-schemas/users';

describe('UpdateUserUserInterfacePreferencesSchema', () => {
	it('should parse hideImageCarousel from a true form value', () => {
		const result = UpdateUserUserInterfacePreferencesSchema.form.parse({
			hideImageCarousel: 'true',
		});

		expect(result.hideImageCarousel).toBe(true);
	});

	it('should parse hideImageCarousel from a false form value', () => {
		const result = UpdateUserUserInterfacePreferencesSchema.form.parse({
			hideImageCarousel: 'false',
		});

		expect(result.hideImageCarousel).toBe(false);
	});

	it('should leave hideImageCarousel undefined when omitted', () => {
		const result = UpdateUserUserInterfacePreferencesSchema.form.parse({});

		expect(result.hideImageCarousel).toBeUndefined();
	});
});
