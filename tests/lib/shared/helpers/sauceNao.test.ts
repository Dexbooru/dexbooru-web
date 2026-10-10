import { describe, expect, it } from 'vitest';
import { getSauceNaoIndexWebsiteBaseUrl } from '$lib/shared/constants/sauceNao';
import {
	buildSauceNaoDbMask,
	pickSauceNaoPostSource,
	resolvePostSource,
} from '$lib/shared/helpers/sauceNao';
import type { TSauceNaoMatch } from '$lib/shared/types/sauceNao';

const match = (overrides: Partial<TSauceNaoMatch>): TSauceNaoMatch => ({
	indexId: 9,
	indexName: 'Danbooru',
	sourceType: null,
	similarity: 90,
	thumbnailUrl: 'https://img.saucenao.com/x.jpg',
	title: null,
	sourceUrls: [],
	artists: [],
	characters: [],
	series: [],
	...overrides,
});

describe('pickSauceNaoPostSource', () => {
	it('takes character and series from the most similar match that has both', () => {
		const picked = pickSauceNaoPostSource([
			match({ similarity: 97, characters: ['Hatsune Miku'] }),
			match({ similarity: 92, characters: ['Kagamine Rin'], series: ['Vocaloid'] }),
			match({ similarity: 95, characters: ['Hatsune Miku', 'Kagamine Len'], series: ['Vocaloid'] }),
		]);
		expect(picked).toEqual({
			characterName: 'hatsune_miku',
			sourceTitle: 'vocaloid',
			sourceType: 'OTHER',
		});
	});

	it('uses the source type carried on the match', () => {
		const picked = pickSauceNaoPostSource([
			match({
				sourceType: 'MANGA',
				characters: ['Frieren'],
				series: ['Sousou no Frieren'],
			}),
		]);
		expect(picked).toEqual({
			characterName: 'frieren',
			sourceTitle: 'sousou_no_frieren',
			sourceType: 'MANGA',
		});
	});

	it('returns null when no match names both a character and a series', () => {
		expect(pickSauceNaoPostSource([match({ characters: ['Frieren'] })])).toBeNull();
	});
});

describe('resolvePostSource', () => {
	const detected = {
		characterName: 'hatsune_miku',
		sourceTitle: 'vocaloid',
		sourceType: 'OTHER' as const,
	};

	it('uses detected values when no override is given', () => {
		expect(resolvePostSource({}, detected)).toEqual({ status: 'known', ...detected });
	});

	it('lets each override replace only its own field', () => {
		expect(
			resolvePostSource({ characterName: 'kagamine_rin', sourceType: 'VIDEOGAME' }, detected),
		).toEqual({
			status: 'known',
			characterName: 'kagamine_rin',
			sourceTitle: 'vocaloid',
			sourceType: 'VIDEOGAME',
		});
	});

	it('is known from overrides alone and defaults the type to OTHER', () => {
		expect(
			resolvePostSource({ characterName: 'frieren', sourceTitle: 'sousou_no_frieren' }, null),
		).toEqual({
			status: 'known',
			characterName: 'frieren',
			sourceTitle: 'sousou_no_frieren',
			sourceType: 'OTHER',
		});
	});

	it('keeps the detected type when the series override matches the detected series', () => {
		const mangaDetected = { ...detected, sourceType: 'MANGA' as const };
		expect(
			resolvePostSource({ characterName: 'hatsune_miku', sourceTitle: 'vocaloid' }, mangaDetected),
		).toEqual({ status: 'known', ...mangaDetected });
	});

	it('drops the detected type when the series override names a different series', () => {
		const mangaDetected = { ...detected, sourceType: 'MANGA' as const };
		expect(resolvePostSource({ sourceTitle: 'genshin_impact' }, mangaDetected)).toEqual({
			status: 'known',
			characterName: 'hatsune_miku',
			sourceTitle: 'genshin_impact',
			sourceType: 'OTHER',
		});
	});

	it('is unknown when the character or series cannot be resolved', () => {
		expect(resolvePostSource({ characterName: 'frieren' }, null)).toEqual({ status: 'unknown' });
		expect(resolvePostSource({}, null)).toEqual({ status: 'unknown' });
	});
});

describe('buildSauceNaoDbMask', () => {
	it('sets bits 5 and 9', () => {
		expect(buildSauceNaoDbMask([5, 9])).toBe('544');
	});

	it('sets bit 17', () => {
		expect(buildSauceNaoDbMask([17])).toBe('131072');
	});

	it('sets bit 40 without truncating past 32 bits', () => {
		expect(buildSauceNaoDbMask([40])).toBe('1099511627776');
	});

	it('returns zero for an empty selection', () => {
		expect(buildSauceNaoDbMask([])).toBe('0');
	});
});

describe('getSauceNaoIndexWebsiteBaseUrl', () => {
	it('returns known index home pages', () => {
		expect(getSauceNaoIndexWebsiteBaseUrl(0)).toBe('https://www.dlsite.com/home/maniax/');
		expect(getSauceNaoIndexWebsiteBaseUrl(5)).toBe('https://www.pixiv.net');
		expect(getSauceNaoIndexWebsiteBaseUrl(9)).toBe('https://danbooru.donmai.us');
		expect(getSauceNaoIndexWebsiteBaseUrl(43)).toBe('https://kemono.cr');
	});

	it('returns undefined only for the reserved index id', () => {
		expect(getSauceNaoIndexWebsiteBaseUrl(17)).toBeUndefined();
	});

	it('maps every catalog index id except #17', () => {
		const catalogIds = [
			0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26,
			27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
		];
		for (const id of catalogIds) {
			expect(getSauceNaoIndexWebsiteBaseUrl(id)).toMatch(/^https:\/\//);
		}
	});
});
