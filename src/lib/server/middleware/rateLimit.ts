import logger from '../logging/logger';

export type RateLimitRule = {
	max: number;
	windowMs: number;
};

export type TRateLimitRedis = {
	incr: (key: string) => Promise<number>;
	pExpire: (key: string, milliseconds: number) => Promise<boolean | number>;
	pTTL: (key: string) => Promise<number>;
};

export type ConsumeRateLimitOk = {
	ok: true;
	remaining: number;
	resetSeconds: number;
};

export type ConsumeRateLimitExceeded = {
	ok: false;
	retryAfterSeconds: number;
};

export type ConsumeRateLimitResult = ConsumeRateLimitOk | ConsumeRateLimitExceeded;

export function sanitizeClientAddressForRateLimitKey(address: string): string {
	return address.replaceAll(':', '_');
}

export async function consumeRateLimit(
	redis: TRateLimitRedis,
	opts: {
		keyPrefix: string;
		identifier: string;
		rule: RateLimitRule;
	},
): Promise<ConsumeRateLimitResult> {
	const { keyPrefix, identifier, rule } = opts;
	const { max, windowMs } = rule;
	const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
	const key = `${keyPrefix}:${identifier}:${windowStart}`;

	try {
		const count = await redis.incr(key);
		if (count === 1) {
			await redis.pExpire(key, windowMs);
		}

		if (count > max) {
			const pttl = await redis.pTTL(key);
			const retryAfterSeconds =
				pttl > 0 ? Math.max(1, Math.ceil(pttl / 1000)) : Math.max(1, Math.ceil(windowMs / 1000));
			return { ok: false, retryAfterSeconds };
		}

		const ttlMs = await redis.pTTL(key);
		const resetSeconds =
			ttlMs > 0 ? Math.ceil(ttlMs / 1000) : Math.max(1, Math.ceil(windowMs / 1000));
		const remaining = Math.max(0, max - count);

		return { ok: true, remaining, resetSeconds };
	} catch (error) {
		// Fail-open: do not block traffic when Redis is unavailable.
		logger.error('Rate limit check failed (Redis); allowing request', { keyPrefix, error });
		const resetSeconds = Math.max(1, Math.ceil(windowMs / 1000));
		return { ok: true, remaining: max, resetSeconds };
	}
}

const RATE_LIMIT_MESSAGE = 'Too many requests. Try again later.';

export function rateLimitExceededApiResponse(retryAfterSeconds: number): Response {
	const body = JSON.stringify({
		status: 429,
		message: RATE_LIMIT_MESSAGE,
		data: null,
	});
	return new Response(body, {
		status: 429,
		headers: {
			'Retry-After': String(retryAfterSeconds),
		},
	});
}
