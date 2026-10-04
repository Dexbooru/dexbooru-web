import { describe, expect, it } from 'vitest';
import {
	buildSauceNaoDbMask,
	pickSauceNaoPostSource,
	resolvePostSource,
} from '$lib/shared/helpers/sauceNao';
import type { TSauceNaoMatch } from '$lib/shared/types/sauceNao';

const match = (overrides: Partial<TSauceNaoMatch>): TSauceNaoMatch => ({
	indexId: 9,
	indexName: 'Danbooru',
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

	it('uses the source type of the index the match came from', () => {
		const picked = pickSauceNaoPostSource([
			match({ indexId: 37, characters: ['Frieren'], series: ['Sousou no Frieren'] }),
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
	it('sets the documented bit for indexes below the reserved slot', () => {
		expect(buildSauceNaoDbMask([5])).toBe('32');
		expect(buildSauceNaoDbMask([5, 9])).toBe('544');
	});

	it('uses the shifted bit for indexes after reserved index 17', () => {
		expect(buildSauceNaoDbMask([18])).toBe(String(0x20000));
		expect(buildSauceNaoDbMask([25])).toBe(String(0x1000000));
	});

	it('builds masks wider than 32 bits without truncation', () => {
		expect(buildSauceNaoDbMask([41])).toBe('1099511627776');
		expect(buildSauceNaoDbMask([44, 5])).toBe('8796093022240');
	});

	it('returns zero for an empty selection', () => {
		expect(buildSauceNaoDbMask([])).toBe('0');
	});

	it('rejects unknown and reserved index ids', () => {
		expect(() => buildSauceNaoDbMask([17])).toThrow('Unknown SauceNAO index id: 17');
	});
});
