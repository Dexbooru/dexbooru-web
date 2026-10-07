import { describe, expect, it, vi } from 'vitest';
import {
	lookupSauceNaoSuggestions,
	readCachedSauceNaoMatches,
} from '$lib/server/helpers/sauceNao/search';

const IMAGE = new Uint8Array([1, 2, 3, 4]);
const IMAGE_HASH = '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a';
const CACHE_KEY = `saucenao:v2:544:${IMAGE_HASH}`;

const pixivResult = {
	header: {
		similarity: '93.5',
		thumbnail: 'https://img.saucenao.com/pixiv.jpg',
		index_id: 5,
		index_name: 'Index #5: Pixiv Images',
	},
	data: {
		ext_urls: ['https://www.pixiv.net/artworks/12345'],
		member_name: 'Pixiv Artist',
		title: 'Evening Light',
	},
};

const lowResult = {
	header: {
		similarity: '40',
		thumbnail: 'https://img.saucenao.com/low.jpg',
		index_id: 9,
		index_name: 'Danbooru',
	},
	data: {
		creator: 'Low Artist',
	},
};

const successBody = (results: unknown[]) => ({
	header: { status: 0, short_remaining: 4, long_remaining: 90 },
	results,
});

type TSetCall = { key: string; value: string; options?: { PX: number } };

const createRedis = (seed: Record<string, string> = {}) => {
	const store = new Map(Object.entries(seed));
	const sets: TSetCall[] = [];
	return {
		sets,
		client: {
			get: async (key: string) => store.get(key) ?? null,
			set: async (key: string, value: string, options?: { PX: number }) => {
				sets.push({ key, value, options });
				store.set(key, value);
				return 'OK';
			},
		},
	};
};

const createFetch = (responses: Array<Response | Error>) => {
	const calls: { url: string; init: RequestInit }[] = [];
	const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		calls.push({ url: String(input), init: init ?? {} });
		const next = responses.shift();
		if (!next) throw new Error('unexpected fetch');
		if (next instanceof Error) throw next;
		return next;
	});
	return { fetchImpl, calls };
};

const jsonResponse = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), { status });

const lookup = (
	redisClient: ReturnType<typeof createRedis>['client'],
	fetchImpl: ReturnType<typeof createFetch>['fetchImpl'],
	overrides: { minimumSimilarity?: number; apiKey?: string; enabledIndexIds?: number[] } = {},
) => {
	const sleeps: number[] = [];
	const pending = lookupSauceNaoSuggestions(IMAGE, {
		fetch: fetchImpl,
		sleep: async (milliseconds) => {
			sleeps.push(milliseconds);
		},
		random: () => 0.5,
		redis: redisClient,
		apiKey: overrides.apiKey ?? 'test-key',
		configuration: {
			sauceNaoEnabledIndexes: overrides.enabledIndexIds ?? [5, 9],
			sauceNaoMinimumSimilarity: overrides.minimumSimilarity ?? 70,
		},
	});
	return { pending, sleeps };
};

describe('lookupSauceNaoSuggestions', () => {
	it('returns disabled without calling SauceNAO when the key or index list is empty', async () => {
		const redis = createRedis();
		const missingKey = createFetch([]);
		const emptyIndexes = createFetch([]);

		await expect(
			lookup(redis.client, missingKey.fetchImpl, { apiKey: '  ' }).pending,
		).resolves.toEqual({ status: 'disabled' });
		await expect(
			lookup(redis.client, emptyIndexes.fetchImpl, { enabledIndexIds: [] }).pending,
		).resolves.toEqual({ status: 'disabled' });
		expect(missingKey.fetchImpl).not.toHaveBeenCalled();
		expect(emptyIndexes.fetchImpl).not.toHaveBeenCalled();
	});

	it('posts the image and succeeds after one short-window 429', async () => {
		const timeout = vi.spyOn(AbortSignal, 'timeout');
		try {
			const redis = createRedis();
			const { fetchImpl, calls } = createFetch([
				jsonResponse({ header: { status: 0, long_remaining: 80, short_remaining: 0 } }, 429),
				jsonResponse(successBody([pixivResult]), 200),
			]);
			const { pending, sleeps } = lookup(redis.client, fetchImpl);

			await expect(pending).resolves.toEqual({
				status: 'ok',
				suggestions: {
					matches: [
						{
							indexId: 5,
							indexName: 'Pixiv',
							similarity: 93.5,
							thumbnailUrl: 'https://img.saucenao.com/pixiv.jpg',
							title: 'Evening Light',
							sourceUrls: ['https://www.pixiv.net/artworks/12345'],
							artists: ['Pixiv Artist'],
							characters: [],
							series: [],
						},
					],
					artists: ['Pixiv Artist'],
					characters: [],
					series: [],
					sourceUrls: ['https://www.pixiv.net/artworks/12345'],
				},
			});
			expect(calls).toHaveLength(2);
			expect(calls[0]?.url).toBe(
				'https://saucenao.com/search.php?output_type=2&api_key=test-key&dbmask=544&numres=8&dedupe=2&hide=0',
			);
			expect(calls[0]?.init.method).toBe('POST');
			const file = (calls[0]?.init.body as FormData).get('file');
			expect(file).toBeInstanceOf(Blob);
			expect((file as Blob).size).toBe(4);
			expect(sleeps).toEqual([500]);
			expect(timeout).toHaveBeenCalledWith(15_000);
			expect(redis.sets[0]).toEqual({
				key: CACHE_KEY,
				value: JSON.stringify([
					{
						indexId: 5,
						indexName: 'Pixiv',
						similarity: 93.5,
						thumbnailUrl: 'https://img.saucenao.com/pixiv.jpg',
						title: 'Evening Light',
						sourceUrls: ['https://www.pixiv.net/artworks/12345'],
						artists: ['Pixiv Artist'],
						characters: [],
						series: [],
					},
				]),
				options: { PX: 604_800_000 },
			});
		} finally {
			timeout.mockRestore();
		}
	});

	it('retries a positive header status and then accepts the next result', async () => {
		const redis = createRedis();
		const { fetchImpl, calls } = createFetch([
			jsonResponse({ header: { status: 2, message: 'busy' }, results: [] }, 200),
			jsonResponse(successBody([pixivResult]), 200),
		]);
		const { pending } = lookup(redis.client, fetchImpl);

		await expect(pending).resolves.toMatchObject({
			status: 'ok',
			suggestions: { artists: ['Pixiv Artist'] },
		});
		expect(calls).toHaveLength(2);
		expect(redis.sets.map((call) => call.key)).toEqual([CACHE_KEY]);
	});

	it('fails after three 5xx responses and does not cache them', async () => {
		const redis = createRedis();
		const { fetchImpl, calls } = createFetch([
			new Response('nope', { status: 503 }),
			new Response('nope', { status: 502 }),
			new Response('nope', { status: 500 }),
		]);
		const { pending, sleeps } = lookup(redis.client, fetchImpl);

		await expect(pending).resolves.toEqual({ status: 'unavailable' });
		expect(calls).toHaveLength(3);
		expect(sleeps).toEqual([500, 1000]);
		expect(redis.sets).toEqual([]);
	});

	it('stops after one response whose header status is negative', async () => {
		const redis = createRedis();
		const { fetchImpl, calls } = createFetch([
			jsonResponse({ header: { status: -1, message: 'Invalid file.' } }, 200),
		]);
		const { pending } = lookup(redis.client, fetchImpl);

		await expect(pending).resolves.toEqual({ status: 'unavailable' });
		expect(calls).toHaveLength(1);
		expect(redis.sets).toEqual([]);
	});

	it('stops after one other 4xx response', async () => {
		const redis = createRedis();
		const { fetchImpl, calls } = createFetch([jsonResponse({ header: { status: 0 } }, 403)]);
		const { pending } = lookup(redis.client, fetchImpl);

		await expect(pending).resolves.toEqual({ status: 'unavailable' });
		expect(calls).toHaveLength(1);
	});

	it('returns rate_limited after one daily 429 and sets an hour cooldown', async () => {
		const redis = createRedis();
		const { fetchImpl, calls } = createFetch([
			jsonResponse({ header: { status: 0, long_remaining: 0, short_remaining: 0 } }, 429),
		]);
		const { pending } = lookup(redis.client, fetchImpl);

		await expect(pending).resolves.toEqual({ status: 'rate_limited' });
		expect(calls).toHaveLength(1);
		expect(redis.sets).toEqual([
			{ key: 'saucenao:cooldown', value: 'daily', options: { PX: 3_600_000 } },
		]);
	});

	it('returns rate_limited after three short-window 429s and sets a 30s cooldown', async () => {
		const redis = createRedis();
		const { fetchImpl, calls } = createFetch([
			jsonResponse({ header: { status: 0, long_remaining: 10, short_remaining: 0 } }, 429),
			jsonResponse({ header: { status: 0, long_remaining: 10, short_remaining: 0 } }, 429),
			jsonResponse({ header: { status: 0, long_remaining: 10, short_remaining: 0 } }, 429),
		]);
		const { pending } = lookup(redis.client, fetchImpl);

		await expect(pending).resolves.toEqual({ status: 'rate_limited' });
		expect(calls).toHaveLength(3);
		expect(redis.sets).toEqual([
			{ key: 'saucenao:cooldown', value: 'short', options: { PX: 30_000 } },
		]);
	});

	it('caches matches below the cutoff and skips fetch on a later read', async () => {
		const redis = createRedis();
		const first = createFetch([jsonResponse(successBody([pixivResult, lowResult]), 200)]);
		const firstLookup = lookup(redis.client, first.fetchImpl, { minimumSimilarity: 80 });

		const firstResult = await firstLookup.pending;
		expect(firstResult).toEqual({
			status: 'ok',
			suggestions: {
				matches: [
					{
						indexId: 5,
						indexName: 'Pixiv',
						similarity: 93.5,
						thumbnailUrl: 'https://img.saucenao.com/pixiv.jpg',
						title: 'Evening Light',
						sourceUrls: ['https://www.pixiv.net/artworks/12345'],
						artists: ['Pixiv Artist'],
						characters: [],
						series: [],
					},
				],
				artists: ['Pixiv Artist'],
				characters: [],
				series: [],
				sourceUrls: ['https://www.pixiv.net/artworks/12345'],
			},
		});
		expect(redis.sets[0]?.key).toBe(CACHE_KEY);
		expect(JSON.parse(redis.sets[0]?.value ?? '[]')).toEqual([
			{
				indexId: 5,
				indexName: 'Pixiv',
				similarity: 93.5,
				thumbnailUrl: 'https://img.saucenao.com/pixiv.jpg',
				title: 'Evening Light',
				sourceUrls: ['https://www.pixiv.net/artworks/12345'],
				artists: ['Pixiv Artist'],
				characters: [],
				series: [],
			},
			{
				indexId: 9,
				indexName: 'Danbooru',
				similarity: 40,
				thumbnailUrl: 'https://img.saucenao.com/low.jpg',
				title: null,
				sourceUrls: [],
				artists: ['Low Artist'],
				characters: [],
				series: [],
			},
		]);

		const second = createFetch([]);
		const secondLookup = lookup(redis.client, second.fetchImpl, { minimumSimilarity: 30 });
		const secondResult = await secondLookup.pending;
		expect(second.fetchImpl).not.toHaveBeenCalled();
		expect(secondResult.status).toBe('ok');
		if (secondResult.status !== 'ok') return;
		expect(secondResult.suggestions.artists).toEqual(['Pixiv Artist', 'Low Artist']);
	});

	it('stores an empty result for one day', async () => {
		const redis = createRedis();
		const { fetchImpl } = createFetch([jsonResponse(successBody([]), 200)]);
		const { pending } = lookup(redis.client, fetchImpl);

		await expect(pending).resolves.toEqual({
			status: 'ok',
			suggestions: {
				matches: [],
				artists: [],
				characters: [],
				series: [],
				sourceUrls: [],
			},
		});
		expect(redis.sets[0]?.options).toEqual({ PX: 86_400_000 });
	});

	it('skips SauceNAO when the cooldown key is set', async () => {
		const redis = createRedis({ 'saucenao:cooldown': 'daily' });
		const { fetchImpl } = createFetch([]);
		const { pending } = lookup(redis.client, fetchImpl);

		await expect(pending).resolves.toEqual({ status: 'rate_limited' });
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('still calls SauceNAO when redis reads fail', async () => {
		const client = {
			get: async () => {
				throw new Error('redis down');
			},
			set: async () => {
				throw new Error('redis down');
			},
		};
		const { fetchImpl } = createFetch([jsonResponse(successBody([pixivResult]), 200)]);
		const { pending } = lookup(client, fetchImpl);

		await expect(pending).resolves.toMatchObject({
			status: 'ok',
			suggestions: { artists: ['Pixiv Artist'] },
		});
		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});
});

const cachedMatch = (similarity: number, indexId: number) => ({
	indexId,
	indexName: indexId === 5 ? 'Pixiv' : 'Danbooru',
	similarity,
	thumbnailUrl: 'https://img.saucenao.com/cached.jpg',
	title: null,
	sourceUrls: [] as string[],
	artists: [] as string[],
	characters: ['Hatsune Miku'],
	series: ['Vocaloid'],
});

const readOptions = (
	redisClient: ReturnType<typeof createRedis>['client'],
	fetchImpl: ReturnType<typeof createFetch>['fetchImpl'],
	overrides: { apiKey?: string; minimumSimilarity?: number } = {},
) => ({
	fetch: fetchImpl,
	redis: redisClient,
	apiKey: overrides.apiKey ?? 'test-key',
	configuration: {
		sauceNaoEnabledIndexes: [5, 9],
		sauceNaoMinimumSimilarity: overrides.minimumSimilarity ?? 70,
	},
});

describe('readCachedSauceNaoMatches', () => {
	it('returns [] on a cache miss and does not call SauceNAO', async () => {
		const redis = createRedis();
		const { fetchImpl } = createFetch([]);

		await expect(
			readCachedSauceNaoMatches(IMAGE, readOptions(redis.client, fetchImpl)),
		).resolves.toEqual([]);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('returns cached matches at or above the similarity cutoff, highest first', async () => {
		const high = cachedMatch(93.5, 5);
		const low = cachedMatch(40, 9);
		const redis = createRedis({ [CACHE_KEY]: JSON.stringify([low, high]) });
		const { fetchImpl } = createFetch([]);

		await expect(
			readCachedSauceNaoMatches(IMAGE, readOptions(redis.client, fetchImpl)),
		).resolves.toEqual([high]);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('returns [] when SauceNAO is disabled and does not call SauceNAO', async () => {
		const redis = createRedis({ [CACHE_KEY]: JSON.stringify([cachedMatch(99, 5)]) });
		const { fetchImpl } = createFetch([]);

		await expect(
			readCachedSauceNaoMatches(IMAGE, readOptions(redis.client, fetchImpl, { apiKey: '  ' })),
		).resolves.toEqual([]);
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('returns [] when the cache read throws and does not call SauceNAO', async () => {
		const client = {
			get: async () => {
				throw new Error('redis down');
			},
			set: async () => 'OK',
		};
		const { fetchImpl } = createFetch([]);

		await expect(readCachedSauceNaoMatches(IMAGE, readOptions(client, fetchImpl))).resolves.toEqual(
			[],
		);
		expect(fetchImpl).not.toHaveBeenCalled();
	});
});
