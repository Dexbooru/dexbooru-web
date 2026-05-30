import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce, memoize } from '$lib/client/helpers/util';

describe('debounce', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('invokes fn only after timeout with final args', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);

		debounced('first');
		debounced('second');

		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);

		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('second');
	});

	it('cancels earlier scheduled calls', () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 100);

		debounced('a');
		vi.advanceTimersByTime(50);
		debounced('b');
		vi.advanceTimersByTime(50);

		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(50);

		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('b');
	});
});

describe('memoize (sync)', () => {
	it('returns cached value for same args', () => {
		const fn = vi.fn((a: number, b: number) => a + b);
		const memoized = memoize(fn);

		expect(memoized(1, 2)).toBe(3);
		expect(memoized(1, 2)).toBe(3);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('recomputes for different args', () => {
		const fn = vi.fn((value: string) => value.toUpperCase());
		const memoized = memoize(fn);

		expect(memoized('a')).toBe('A');
		expect(memoized('b')).toBe('B');
		expect(fn).toHaveBeenCalledTimes(2);
	});
});
