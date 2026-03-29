import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	consumeRateLimit,
	rateLimitExceededApiResponse,
	sanitizeClientAddressForRateLimitKey,
} from '$lib/server/middleware/rateLimit';
import { mockLogger } from '../../../mocks/logging/logger';

describe('rateLimit middleware', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('sanitizeClientAddressForRateLimitKey', () => {
		it('replaces colons for IPv6-safe Redis keys', () => {
			expect(sanitizeClientAddressForRateLimitKey('2001:db8::1')).toBe('2001_db8__1');
			expect(sanitizeClientAddressForRateLimitKey('127.0.0.1')).toBe('127.0.0.1');
		});
	});

	describe('consumeRateLimit', () => {
		const rule = { max: 10, windowMs: 60_000 };

		it('returns ok with remaining when under the limit', async () => {
			const redis = {
				incr: vi.fn().mockResolvedValue(3),
				pExpire: vi.fn().mockResolvedValue(true),
				pTTL: vi.fn().mockResolvedValue(45_000),
			};
			const result = await consumeRateLimit(redis, {
				keyPrefix: 'rl:test',
				identifier: 'ip:user',
				rule,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.remaining).toBe(7);
				expect(result.resetSeconds).toBe(45);
			}
			expect(redis.incr).toHaveBeenCalledOnce();
			expect(redis.pExpire).not.toHaveBeenCalled();
		});

		it('sets expiry on first increment in a window', async () => {
			const redis = {
				incr: vi.fn().mockResolvedValue(1),
				pExpire: vi.fn().mockResolvedValue(true),
				pTTL: vi.fn().mockResolvedValue(60_000),
			};
			await consumeRateLimit(redis, {
				keyPrefix: 'rl:test',
				identifier: 'a:b',
				rule,
			});
			expect(redis.pExpire).toHaveBeenCalledWith(expect.stringContaining('rl:test:a:b:'), 60_000);
		});

		it('does not set expiry when count is not 1', async () => {
			const redis = {
				incr: vi.fn().mockResolvedValue(2),
				pExpire: vi.fn().mockResolvedValue(true),
				pTTL: vi.fn().mockResolvedValue(59_000),
			};
			await consumeRateLimit(redis, {
				keyPrefix: 'rl:test',
				identifier: 'a:b',
				rule,
			});
			expect(redis.pExpire).not.toHaveBeenCalled();
		});

		it('returns not ok when count exceeds max', async () => {
			const redis = {
				incr: vi.fn().mockResolvedValue(11),
				pExpire: vi.fn().mockResolvedValue(true),
				pTTL: vi.fn().mockResolvedValue(8_500),
			};
			const result = await consumeRateLimit(redis, {
				keyPrefix: 'rl:test',
				identifier: 'a:b',
				rule,
			});
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.retryAfterSeconds).toBe(9);
			}
		});

		it('uses minimum retry-after of 1 second when pTTL is small', async () => {
			const redis = {
				incr: vi.fn().mockResolvedValue(11),
				pExpire: vi.fn().mockResolvedValue(true),
				pTTL: vi.fn().mockResolvedValue(400),
			};
			const result = await consumeRateLimit(redis, {
				keyPrefix: 'rl:test',
				identifier: 'a:b',
				rule,
			});
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.retryAfterSeconds).toBe(1);
			}
		});

		it('fail-opens and logs when Redis throws', async () => {
			const redis = {
				incr: vi.fn().mockRejectedValue(new Error('connection refused')),
				pExpire: vi.fn(),
				pTTL: vi.fn(),
			};
			const result = await consumeRateLimit(redis, {
				keyPrefix: 'rl:test',
				identifier: 'a:b',
				rule,
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.remaining).toBe(10);
			}
			expect(mockLogger.error).toHaveBeenCalledWith(
				'Rate limit check failed (Redis); allowing request',
				expect.objectContaining({ keyPrefix: 'rl:test' }),
			);
		});
	});

	describe('rateLimitExceededApiResponse', () => {
		it('returns 429 JSON body and Retry-After header', async () => {
			const res = rateLimitExceededApiResponse(42);
			expect(res.status).toBe(429);
			expect(res.headers.get('Retry-After')).toBe('42');
			const json = (await res.json()) as { status: number; message: string; data: unknown };
			expect(json.status).toBe(429);
			expect(json.message).toContain('Too many requests');
			expect(json.data).toBeNull();
		});
	});
});
