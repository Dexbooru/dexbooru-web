import { describe, expect, it } from 'vitest';
import {
	fullJitterBackoffMs,
	isAbortError,
	isAbortOrTimeoutError,
} from '$lib/shared/helpers/async';

const namedError = (name: string) => Object.assign(new Error(name), { name });

describe('fullJitterBackoffMs', () => {
	it('scales the ceiling exponentially by retry index', () => {
		const options = { baseMs: 1_000, capMs: 8_000, random: () => 0.5 };
		expect(fullJitterBackoffMs({ ...options, retryIndex: 0 })).toBe(500);
		expect(fullJitterBackoffMs({ ...options, retryIndex: 1 })).toBe(1_000);
		expect(fullJitterBackoffMs({ ...options, retryIndex: 2 })).toBe(2_000);
	});

	it('never exceeds the cap', () => {
		expect(
			fullJitterBackoffMs({ retryIndex: 10, baseMs: 1_000, capMs: 8_000, random: () => 0.999 }),
		).toBe(7_992);
	});
});

describe('abort error predicates', () => {
	it('recognizes aborts and timeouts', () => {
		expect(isAbortError(namedError('AbortError'))).toBe(true);
		expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
		expect(isAbortError(namedError('TimeoutError'))).toBe(false);
		expect(isAbortOrTimeoutError(namedError('TimeoutError'))).toBe(true);
		expect(isAbortOrTimeoutError(namedError('AbortError'))).toBe(true);
	});

	it('rejects other errors and non-errors', () => {
		expect(isAbortOrTimeoutError(new TypeError('fetch failed'))).toBe(false);
		expect(isAbortOrTimeoutError('AbortError')).toBe(false);
	});
});
