import { describe, expect, it } from 'vitest';
import {
	aggregateSauceNaoSuggestions,
	normalizeSauceNaoResult,
} from '$lib/server/helpers/sauceNao/normalize';
import type { TSauceNaoMatch } from '$lib/shared/types/sauceNao';
import type { TSauceNaoResult } from '$lib/server/helpers/sauceNao/schema';

const result = (
	header: TSauceNaoResult['header'],
	data: Record<string, unknown>,
): TSauceNaoResult => ({ header, data });

describe('normalizeSauceNaoResult', () => {
	it('reads a pixiv result from member_name, title, and ext_urls', () => {
		expect(
			normalizeSauceNaoResult(
				result(
					{
						similarity: '93.5',
						thumbnail: 'https://img.saucenao.com/pixiv.jpg',
						index_id: 5,
						index_name: 'Index #5: Pixiv Images',
					},
					{
						ext_urls: ['https://www.pixiv.net/artworks/12345'],
						member_name: 'Pixiv Artist',
						member_id: 99,
						title: 'Evening Light',
					},
				),
			),
		).toEqual({
			indexId: 5,
			indexName: 'Pixiv',
			similarity: 93.5,
			thumbnailUrl: 'https://img.saucenao.com/pixiv.jpg',
			title: 'Evening Light',
			sourceUrls: ['https://www.pixiv.net/artworks/12345'],
			artists: ['Pixiv Artist'],
			characters: [],
			series: [],
		});
	});

	it('splits danbooru creator, characters, and material, and keeps a URL source out of series', () => {
		expect(
			normalizeSauceNaoResult(
				result(
					{
						similarity: '88.2',
						thumbnail: 'https://img.saucenao.com/danbooru.jpg',
						index_id: 9,
						index_name: 'Danbooru',
					},
					{
						ext_urls: ['https://danbooru.donmai.us/posts/1'],
						creator: 'artist_one, artist_two',
						characters: 'char_one, char_two',
						material: 'series_one, original',
						source: 'https://www.pixiv.net/artworks/999',
					},
				),
			),
		).toEqual({
			indexId: 9,
			indexName: 'Danbooru',
			similarity: 88.2,
			thumbnailUrl: 'https://img.saucenao.com/danbooru.jpg',
			title: null,
			sourceUrls: ['https://danbooru.donmai.us/posts/1', 'https://www.pixiv.net/artworks/999'],
			artists: ['artist_one', 'artist_two'],
			characters: ['char_one', 'char_two'],
			series: ['series_one'],
		});
	});

	it('reads a twitter handle and treats a URL source as a source url', () => {
		expect(
			normalizeSauceNaoResult(
				result(
					{
						similarity: '80',
						thumbnail: 'https://img.saucenao.com/twitter.jpg',
						index_id: 41,
						index_name: 'Twitter',
					},
					{
						ext_urls: ['https://twitter.com/i/web/status/1'],
						twitter_user_handle: 'tw_artist',
						source: 'https://twitter.com/tw_artist/status/1',
					},
				),
			),
		).toEqual({
			indexId: 41,
			indexName: 'Twitter',
			similarity: 80,
			thumbnailUrl: 'https://img.saucenao.com/twitter.jpg',
			title: null,
			sourceUrls: ['https://twitter.com/i/web/status/1', 'https://twitter.com/tw_artist/status/1'],
			artists: ['tw_artist'],
			characters: [],
			series: [],
		});
	});

	it('drops non-http ext_urls and thumbnails', () => {
		const match = normalizeSauceNaoResult(
			result(
				{
					similarity: '90',
					thumbnail: 'javascript:alert(1)',
					index_id: 9,
					index_name: 'Danbooru',
				},
				{
					ext_urls: [
						'javascript:alert(1)',
						'data:text/html,hi',
						'https://danbooru.donmai.us/posts/2',
					],
				},
			),
		);
		expect(match.thumbnailUrl).toBe('');
		expect(match.sourceUrls).toEqual(['https://danbooru.donmai.us/posts/2']);
	});

	it('splits array and comma-separated creators and keeps a non-url source as series', () => {
		expect(
			normalizeSauceNaoResult(
				result(
					{
						similarity: '70.25',
						thumbnail: 'https://img.saucenao.com/anime.jpg',
						index_id: 21,
						index_name: 'Anime',
					},
					{
						creator: ['alpha, beta', 'gamma'],
						source: 'My Series, Original',
						eng_name: 'English Title',
						jp_name: 'Japanese Title',
					},
				),
			),
		).toEqual({
			indexId: 21,
			indexName: 'Anime',
			similarity: 70.25,
			thumbnailUrl: 'https://img.saucenao.com/anime.jpg',
			title: 'English Title',
			sourceUrls: [],
			artists: ['alpha', 'beta', 'gamma'],
			characters: [],
			series: ['My Series'],
		});
	});

	it('falls back to the header index name when the index id is unknown', () => {
		const match = normalizeSauceNaoResult(
			result(
				{
					similarity: '10',
					thumbnail: 'https://img.saucenao.com/unknown.jpg',
					index_id: 999,
					index_name: 'Custom Index',
				},
				{},
			),
		);
		expect(match.indexName).toBe('Custom Index');
		expect(match.title).toBeNull();
	});
});

const match = (
	overrides: Partial<TSauceNaoMatch> & Pick<TSauceNaoMatch, 'similarity'>,
): TSauceNaoMatch => ({
	indexId: 5,
	indexName: 'Pixiv',
	thumbnailUrl: 'https://img.example/thumb.jpg',
	title: null,
	sourceUrls: [],
	artists: [],
	characters: [],
	series: [],
	...overrides,
});

describe('aggregateSauceNaoSuggestions', () => {
	it('drops matches below the cutoff and ranks the rest by summed similarity', () => {
		expect(
			aggregateSauceNaoSuggestions(
				[
					match({
						similarity: 90,
						artists: ['Alice', 'Bob'],
						characters: ['Char A'],
						series: ['Series X'],
						sourceUrls: ['https://example.com/a'],
					}),
					match({
						similarity: 80,
						artists: ['alice', 'Cara'],
						characters: ['Char A', 'Char B'],
						series: ['series x'],
						sourceUrls: ['https://example.com/a', 'https://example.com/b'],
					}),
					match({
						similarity: 50,
						artists: ['Low'],
						characters: ['Dropped'],
						series: ['Dropped Series'],
						sourceUrls: ['https://example.com/low'],
					}),
				],
				70,
			),
		).toEqual({
			matches: [
				match({
					similarity: 90,
					artists: ['Alice', 'Bob'],
					characters: ['Char A'],
					series: ['Series X'],
					sourceUrls: ['https://example.com/a'],
				}),
				match({
					similarity: 80,
					artists: ['alice', 'Cara'],
					characters: ['Char A', 'Char B'],
					series: ['series x'],
					sourceUrls: ['https://example.com/a', 'https://example.com/b'],
				}),
			],
			artists: ['Alice', 'Bob', 'Cara'],
			characters: ['Char A', 'Char B'],
			series: ['Series X'],
			sourceUrls: ['https://example.com/a', 'https://example.com/b'],
		});
	});

	it('keeps equal scores in first-seen order', () => {
		expect(
			aggregateSauceNaoSuggestions(
				[match({ similarity: 10, artists: ['Ada'] }), match({ similarity: 10, artists: ['Bea'] })],
				1,
			).artists,
		).toEqual(['Ada', 'Bea']);
	});
});
