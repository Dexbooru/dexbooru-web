import { describe, expect, it, vi } from 'vitest';

const { getSafeRedirectTo } = await vi.importActual<typeof import('$lib/server/helpers/redirect')>(
	'$lib/server/helpers/redirect',
);

describe('getSafeRedirectTo', () => {
	const defaultPath = '/home';

	it('returns trimmed valid relative path', () => {
		expect(getSafeRedirectTo('  /posts  ', defaultPath)).toBe('/posts');
	});

	it('returns default for protocol-relative URL', () => {
		expect(getSafeRedirectTo('//evil.com/path', defaultPath)).toBe(defaultPath);
	});

	it('returns default for external URL without leading slash', () => {
		expect(getSafeRedirectTo('https://evil.com', defaultPath)).toBe(defaultPath);
	});

	it('returns default for null, undefined, and non-string values', () => {
		expect(getSafeRedirectTo(undefined, defaultPath)).toBe(defaultPath);
		expect(getSafeRedirectTo(null as unknown as string, defaultPath)).toBe(defaultPath);
		expect(getSafeRedirectTo(123 as unknown as string, defaultPath)).toBe(defaultPath);
	});

	it('returns default for whitespace-only input', () => {
		expect(getSafeRedirectTo('   ', defaultPath)).toBe(defaultPath);
	});
});
