import { SauceNaoResponseSchema, type TSauceNaoResult } from './schema';

export type TSauceNaoRetryableCause =
	'network' | 'timeout' | 'http_5xx' | 'header_status' | 'short_rate_limit' | 'invalid_body';

export type TSauceNaoAttemptOutcome =
	| { status: 'ok'; results: TSauceNaoResult[] }
	| { status: 'retryable'; cause: TSauceNaoRetryableCause }
	| { status: 'rate_limited'; window: 'daily' }
	| { status: 'fatal' };

export type TSauceNaoClassifyInput =
	| { kind: 'network' }
	| { kind: 'timeout' }
	| { kind: 'response'; httpStatus: number; body: unknown };

export const classifySauceNaoAttempt = (input: TSauceNaoClassifyInput): TSauceNaoAttemptOutcome => {
	if (input.kind === 'network') return { status: 'retryable', cause: 'network' };
	if (input.kind === 'timeout') return { status: 'retryable', cause: 'timeout' };

	const parsed = SauceNaoResponseSchema.safeParse(input.body);
	if (input.httpStatus === 429) {
		const longRemaining = parsed.success ? parsed.data.header.long_remaining : undefined;
		if (longRemaining !== undefined && longRemaining <= 0) {
			return { status: 'rate_limited', window: 'daily' };
		}
		return { status: 'retryable', cause: 'short_rate_limit' };
	}

	if (input.httpStatus >= 500) return { status: 'retryable', cause: 'http_5xx' };
	if (input.httpStatus >= 400) return { status: 'fatal' };
	if (!parsed.success) return { status: 'retryable', cause: 'invalid_body' };

	const headerStatus = parsed.data.header.status;
	if (headerStatus === 0) {
		return { status: 'ok', results: parsed.data.results ?? [] };
	}
	if (headerStatus > 0) return { status: 'retryable', cause: 'header_status' };
	return { status: 'fatal' };
};
