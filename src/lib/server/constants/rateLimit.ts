export const LIKE_POST_RATE_LIMIT = {
	max: 10,
	windowMs: 60_000,
} as const;

export const REDIS_RATE_LIMIT_KEY_POST_LIKE = 'rl:post:like';
