import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/client/constants/urls', () => ({
	APP_BASE_URL: 'https://app.example.com',
}));

import { buildUrl, getFaviconFromUrl } from '$lib/client/helpers/urls';

describe('getFaviconFromUrl', () => {
	it('returns origin favicon for valid URL', () => {
		expect(getFaviconFromUrl('https://example.com/page')).toBe('https://example.com/favicon.ico');
	});

	it('returns default icon for invalid URL', () => {
		expect(getFaviconFromUrl('not-a-url')).toBe('/default-icon.ico');
	});
});

describe('buildUrl', () => {
	it('resolves relative path against APP_BASE_URL', () => {
		const url = buildUrl('/posts');

		expect(url.href).toBe('https://app.example.com/posts');
	});

	it('appends scalar search params', () => {
		const url = buildUrl('/search', { query: 'cat', pageNumber: 0 });

		expect(url.searchParams.get('query')).toBe('cat');
		expect(url.searchParams.get('pageNumber')).toBe('0');
	});

	it('skips null and undefined params', () => {
		const url = buildUrl('/search', { query: 'cat', ignored: null, alsoIgnored: undefined });

		expect(url.searchParams.get('query')).toBe('cat');
		expect(url.searchParams.has('ignored')).toBe(false);
		expect(url.searchParams.has('alsoIgnored')).toBe(false);
	});

	it('appends array params multiple times', () => {
		const url = buildUrl('/tags', { tag: ['a', 'b'] });

		expect(url.searchParams.getAll('tag')).toEqual(['a', 'b']);
	});
});
