import { describe, expect, it } from 'vitest';
import { getQueryParts } from '$lib/client/helpers/search';

describe('getQueryParts', () => {
	it('returns single normal part when query does not match', () => {
		expect(getQueryParts('hello world', 'xyz')).toEqual([{ text: 'hello world', type: 'normal' }]);
	});

	it('splits around a single highlight match', () => {
		expect(getQueryParts('hello cat world', 'cat')).toEqual([
			{ text: 'hello ', type: 'normal' },
			{ text: 'cat', type: 'highlight' },
			{ text: ' world', type: 'normal' },
		]);
	});

	it('handles multiple non-overlapping matches', () => {
		expect(getQueryParts('cat and cat', 'cat')).toEqual([
			{ text: 'cat', type: 'highlight' },
			{ text: ' and ', type: 'normal' },
			{ text: 'cat', type: 'highlight' },
		]);
	});

	it('returns cached result for repeated inputs', () => {
		const first = getQueryParts('abc def', 'def');
		const second = getQueryParts('abc def', 'def');

		expect(second).toBe(first);
	});
});
