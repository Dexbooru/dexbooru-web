import type { TPostSourceType } from '../types/sauceNao';

export const SAUCENAO_INDEX_DETAILS_URL =
	'https://saucenao.com/tools/examples/api/index_details.txt';

export const DEFAULT_SAUCENAO_ENABLED_INDEX_IDS: number[] = [
	5, 6, 8, 9, 11, 12, 25, 26, 27, 28, 34, 39, 41, 44,
];

export const DEFAULT_SAUCENAO_MINIMUM_SIMILARITY = 70;

export const SAUCENAO_INDEX_SOURCE_TYPE_HINTS: ReadonlyMap<number, TPostSourceType> = new Map([
	[0, 'MANGA'],
	[2, 'VIDEOGAME'],
	[16, 'MANGA'],
	[18, 'MANGA'],
	[21, 'ANIME'],
	[22, 'ANIME'],
	[36, 'MANGA'],
	[37, 'MANGA'],
	[38, 'MANGA'],
]);
