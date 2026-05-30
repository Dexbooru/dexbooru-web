import { describe, expect, it } from 'vitest';
import type { TPost } from '$lib/shared/types/posts';
import {
	formatNumberWithCommas,
	generatePostWrapperMetaTags,
	normalizeCount,
	roundNumber,
} from '$lib/client/helpers/posts';

const emptyPosts: TPost[] = [];

describe('normalizeCount', () => {
	it('returns plain string below 1000', () => {
		expect(normalizeCount(999)).toBe('999');
	});

	it('formats thousands with K suffix', () => {
		expect(normalizeCount(1500)).toBe('1.5K');
	});

	it('formats millions with M suffix', () => {
		expect(normalizeCount(2500000)).toBe('2.5M');
	});
});

describe('formatNumberWithCommas', () => {
	it('inserts comma separators', () => {
		expect(formatNumberWithCommas(1234567)).toBe('1,234,567');
	});
});

describe('roundNumber', () => {
	it('rounds to default 0 decimal places', () => {
		expect(roundNumber(3.7)).toBe(4);
	});

	it('rounds to custom decimal places', () => {
		expect(roundNumber(3.14159, 2)).toBe(3.14);
	});
});

describe('generatePostWrapperMetaTags', () => {
	it('uses 1-based page number in title', () => {
		const { title } = generatePostWrapperMetaTags('Posts', 0, false, 'createdAt', emptyPosts);

		expect(title).toBe('Posts - Page 1');
	});

	it('includes sort label in description for descending createdAt', () => {
		const { description } = generatePostWrapperMetaTags('Posts', 1, false, 'createdAt', emptyPosts);

		expect(description).toBe('0 post(s) sorted by the Most recent criterion');
	});
});
