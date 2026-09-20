import { describe, expect, it, vi } from 'vitest';

const { getSafeNativeReturnUrl, getSafeRedirectTo } = await vi.importActual<
	typeof import('$lib/server/helpers/redirect')
>('$lib/server/helpers/redirect');

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

describe('getSafeNativeReturnUrl', () => {
	it('allows the Dexbooru app scheme and strips query params', () => {
		expect(getSafeNativeReturnUrl('dexboorumobile://oauth/process?token=secret')).toBe(
			'dexboorumobile://oauth/process',
		);
	});

	it('allows Expo Go and development-build schemes', () => {
		expect(getSafeNativeReturnUrl('exp://192.168.1.20:8081/--/oauth/process')).toBe(
			'exp://192.168.1.20:8081/--/oauth/process',
		);
		expect(getSafeNativeReturnUrl('exp+dexboorumobile://expo-development-client')).toBe(
			'exp+dexboorumobile://expo-development-client',
		);
	});

	it('allows local Expo web origins', () => {
		expect(getSafeNativeReturnUrl('http://localhost:8081/oauth/process')).toBe(
			'http://localhost:8081/oauth/process',
		);
		expect(getSafeNativeReturnUrl('http://127.0.0.1:8081/oauth/process/')).toBe(
			'http://127.0.0.1:8081/oauth/process',
		);
	});

	it('rejects remote http(s) origins and invalid values', () => {
		expect(getSafeNativeReturnUrl('https://evil.example/oauth/process')).toBeUndefined();
		expect(getSafeNativeReturnUrl('https://dexbooru.neetbyte.fun/oauth/process')).toBeUndefined();
		expect(getSafeNativeReturnUrl('not a url')).toBeUndefined();
		expect(getSafeNativeReturnUrl('')).toBeUndefined();
		expect(getSafeNativeReturnUrl(undefined)).toBeUndefined();
	});
});
