import { Buffer } from 'node:buffer';
import { getApplicationConfiguration } from '$lib/server/applicationConfiguration';
import type { TApplicationConfiguration } from '$lib/shared/applicationConfiguration';
import {
	SAUCENAO_ATTEMPT_TIMEOUT_MS,
	SAUCENAO_BACKOFF_BASE_MS,
	SAUCENAO_BACKOFF_CAP_MS,
	SAUCENAO_CACHE_KEY_PREFIX,
	SAUCENAO_CACHE_TTL_EMPTY_MS,
	SAUCENAO_CACHE_TTL_NONEMPTY_MS,
	SAUCENAO_COOLDOWN_KEY,
	SAUCENAO_DAILY_COOLDOWN_MS,
	SAUCENAO_DEDUPE_ALL_METHODS,
	SAUCENAO_HIDE_NOTHING,
	SAUCENAO_MAX_ATTEMPTS,
	SAUCENAO_OUTPUT_TYPE_JSON,
	SAUCENAO_RESULTS_PER_SEARCH,
	SAUCENAO_SEARCH_URL,
	SAUCENAO_SHORT_COOLDOWN_MS,
} from '$lib/server/constants/sauceNao';
import redis from '$lib/server/db/redis';
import { hashImageBuffer } from '$lib/server/helpers/images';
import logger from '$lib/server/logging/logger';
import { SAUCENAO_API_KEY } from '$lib/server/runtimeEnv';
import { fullJitterBackoffMs, isAbortOrTimeoutError, sleep } from '$lib/shared/helpers/async';
import { buildSauceNaoDbMask } from '$lib/shared/helpers/sauceNao';
import type { TSauceNaoMatch, TSauceNaoSuggestionsResponse } from '$lib/shared/types/sauceNao';
import { classifySauceNaoAttempt } from './classify';
import { aggregateSauceNaoSuggestions, normalizeSauceNaoResults } from './normalize';
import { CachedSauceNaoMatchesSchema } from './schema';

type TSauceNaoCacheClient = {
	get: (key: string) => Promise<string | null>;
	set: (key: string, value: string, options?: { PX: number }) => Promise<unknown>;
};

export type TSauceNaoLookupOptions = {
	fetch?: typeof fetch;
	sleep?: (milliseconds: number) => Promise<void>;
	random?: () => number;
	redis?: TSauceNaoCacheClient;
	apiKey?: string;
	configuration?: Pick<
		TApplicationConfiguration,
		'sauceNaoEnabledIndexes' | 'sauceNaoMinimumSimilarity'
	>;
};

export type TSauceNaoLookupResult = TSauceNaoSuggestionsResponse | { status: 'unavailable' };

const readCache = async (
	client: TSauceNaoCacheClient,
	key: string,
): Promise<TSauceNaoMatch[] | null> => {
	try {
		const raw = await client.get(key);
		if (!raw) return null;
		const parsed = CachedSauceNaoMatchesSchema.safeParse(JSON.parse(raw));
		if (!parsed.success) return null;
		return parsed.data;
	} catch (error) {
		logger.error('Could not read SauceNAO cache.', error);
		return null;
	}
};

const writeCache = async (client: TSauceNaoCacheClient, key: string, matches: TSauceNaoMatch[]) => {
	const ttl = matches.length === 0 ? SAUCENAO_CACHE_TTL_EMPTY_MS : SAUCENAO_CACHE_TTL_NONEMPTY_MS;
	try {
		await client.set(key, JSON.stringify(matches), { PX: ttl });
	} catch (error) {
		logger.error('Could not write SauceNAO cache.', error);
	}
};

const isCoolingDown = async (client: TSauceNaoCacheClient) => {
	try {
		const raw = await client.get(SAUCENAO_COOLDOWN_KEY);
		return raw != null && raw.length > 0;
	} catch (error) {
		logger.error('Could not read SauceNAO cooldown.', error);
		return false;
	}
};

const writeCooldown = async (client: TSauceNaoCacheClient, window: 'short' | 'daily') => {
	try {
		await client.set(SAUCENAO_COOLDOWN_KEY, window, {
			PX: window === 'daily' ? SAUCENAO_DAILY_COOLDOWN_MS : SAUCENAO_SHORT_COOLDOWN_MS,
		});
	} catch (error) {
		logger.error('Could not set SauceNAO cooldown.', error);
	}
};

const buildSearchUrl = (apiKey: string, dbmask: string) => {
	const url = new URL(SAUCENAO_SEARCH_URL);
	url.searchParams.set('output_type', SAUCENAO_OUTPUT_TYPE_JSON);
	url.searchParams.set('api_key', apiKey);
	url.searchParams.set('dbmask', dbmask);
	url.searchParams.set('numres', SAUCENAO_RESULTS_PER_SEARCH);
	url.searchParams.set('dedupe', SAUCENAO_DEDUPE_ALL_METHODS);
	url.searchParams.set('hide', SAUCENAO_HIDE_NOTHING);
	return url;
};

const sauceNaoCacheClient = (options: TSauceNaoLookupOptions): TSauceNaoCacheClient =>
	options.redis ?? {
		get: (key) => redis.get(key),
		set: (key, value, setOptions) =>
			setOptions ? redis.set(key, value, setOptions) : redis.set(key, value),
	};

type TSauceNaoLookupContext =
	| { status: 'disabled' }
	| {
			status: 'ready';
			minimumSimilarity: number;
			cacheKey: string;
			client: TSauceNaoCacheClient;
			fetchImpl: typeof fetch;
			sleep: (milliseconds: number) => Promise<void>;
			random: () => number;
			requestUrl: URL;
	  };

const prepareSauceNaoLookup = async (
	image: Uint8Array,
	options: TSauceNaoLookupOptions,
): Promise<TSauceNaoLookupContext> => {
	const apiKey = (options.apiKey ?? SAUCENAO_API_KEY).trim();
	const { sauceNaoEnabledIndexes: enabledIndexIds, sauceNaoMinimumSimilarity: minimumSimilarity } =
		options.configuration ?? (await getApplicationConfiguration());
	if (apiKey.length === 0 || enabledIndexIds.length === 0) {
		return { status: 'disabled' };
	}

	const dbmask = buildSauceNaoDbMask(enabledIndexIds);
	return {
		status: 'ready',
		minimumSimilarity,
		cacheKey: `${SAUCENAO_CACHE_KEY_PREFIX}:${dbmask}:${hashImageBuffer(Buffer.from(image))}`,
		client: sauceNaoCacheClient(options),
		fetchImpl: options.fetch ?? fetch,
		sleep: options.sleep ?? sleep,
		random: options.random ?? Math.random,
		requestUrl: buildSearchUrl(apiKey, dbmask),
	};
};

export const readCachedSauceNaoMatches = async (
	image: Uint8Array,
	options: TSauceNaoLookupOptions = {},
): Promise<TSauceNaoMatch[]> => {
	try {
		const context = await prepareSauceNaoLookup(image, options);
		if (context.status === 'disabled') return [];
		const cached = await readCache(context.client, context.cacheKey);
		if (!cached) return [];
		return aggregateSauceNaoSuggestions(cached, context.minimumSimilarity).matches;
	} catch (error) {
		logger.error('Could not read cached SauceNAO matches.', error);
		return [];
	}
};

export const lookupSauceNaoSuggestions = async (
	image: Uint8Array,
	options: TSauceNaoLookupOptions = {},
): Promise<TSauceNaoLookupResult> => {
	const context = await prepareSauceNaoLookup(image, options);
	if (context.status === 'disabled') return { status: 'disabled' };

	const { client, cacheKey, minimumSimilarity, fetchImpl, sleep, random, requestUrl } = context;
	const cached = await readCache(client, cacheKey);
	if (cached !== null) {
		return {
			status: 'ok',
			suggestions: aggregateSauceNaoSuggestions(cached, minimumSimilarity),
		};
	}

	if (await isCoolingDown(client)) {
		return { status: 'rate_limited' };
	}

	const runAttempt = async () => {
		const body = new FormData();
		body.append('file', new Blob([Buffer.from(image)]), 'upload');
		try {
			const response = await fetchImpl(requestUrl, {
				method: 'POST',
				body,
				signal: AbortSignal.timeout(SAUCENAO_ATTEMPT_TIMEOUT_MS),
			});
			let parsedBody: unknown;
			try {
				parsedBody = await response.json();
			} catch {
				parsedBody = undefined;
			}
			return classifySauceNaoAttempt({
				kind: 'response',
				httpStatus: response.status,
				body: parsedBody,
			});
		} catch (error) {
			return classifySauceNaoAttempt(
				isAbortOrTimeoutError(error) ? { kind: 'timeout' } : { kind: 'network' },
			);
		}
	};

	let lastCauseWasShortLimit = false;
	for (let attempt = 0; attempt < SAUCENAO_MAX_ATTEMPTS; attempt += 1) {
		if (attempt > 0) {
			await sleep(
				fullJitterBackoffMs({
					retryIndex: attempt - 1,
					baseMs: SAUCENAO_BACKOFF_BASE_MS,
					capMs: SAUCENAO_BACKOFF_CAP_MS,
					random,
				}),
			);
		}
		const outcome = await runAttempt();
		if (outcome.status === 'ok') {
			const matches = normalizeSauceNaoResults(outcome.results);
			// Similarity is applied on read, so a later cutoff change can reuse this payload.
			await writeCache(client, cacheKey, matches);
			return {
				status: 'ok',
				suggestions: aggregateSauceNaoSuggestions(matches, minimumSimilarity),
			};
		}
		if (outcome.status === 'fatal') return { status: 'unavailable' };
		if (outcome.status === 'rate_limited') {
			await writeCooldown(client, 'daily');
			return { status: 'rate_limited' };
		}
		lastCauseWasShortLimit = outcome.cause === 'short_rate_limit';
	}

	if (lastCauseWasShortLimit) {
		await writeCooldown(client, 'short');
		return { status: 'rate_limited' };
	}
	return { status: 'unavailable' };
};
