import type { TSauceNaoIndex } from '../types/sauceNao';

// `maskBit` comes from the mask column of https://saucenao.com/tools/examples/api/index_details.txt.
// Index #17 is reserved and has no bit, so every index from #18 up sits one bit below its id.
export const SAUCENAO_INDEXES = [
	{ id: 0, maskBit: 0, name: 'H-Magazines', sourceType: 'MANGA' },
	{ id: 2, maskBit: 2, name: 'H-Game CG', sourceType: 'VIDEOGAME' },
	{ id: 5, maskBit: 5, name: 'Pixiv' },
	{ id: 6, maskBit: 6, name: 'Pixiv (historical)' },
	{ id: 8, maskBit: 8, name: 'Nico Nico Seiga' },
	{ id: 9, maskBit: 9, name: 'Danbooru' },
	{ id: 10, maskBit: 10, name: 'Drawr' },
	{ id: 11, maskBit: 11, name: 'Nijie' },
	{ id: 12, maskBit: 12, name: 'Yande.re' },
	{ id: 16, maskBit: 16, name: 'FAKKU', sourceType: 'MANGA' },
	{ id: 18, maskBit: 17, name: 'H-Misc (nhentai)', sourceType: 'MANGA' },
	{ id: 19, maskBit: 18, name: '2D-Market' },
	{ id: 20, maskBit: 19, name: 'MediBang' },
	{ id: 21, maskBit: 20, name: 'Anime', sourceType: 'ANIME' },
	{ id: 22, maskBit: 21, name: 'H-Anime', sourceType: 'ANIME' },
	{ id: 23, maskBit: 22, name: 'Movies' },
	{ id: 24, maskBit: 23, name: 'Shows' },
	{ id: 25, maskBit: 24, name: 'Gelbooru' },
	{ id: 26, maskBit: 25, name: 'Konachan' },
	{ id: 27, maskBit: 26, name: 'Sankaku Channel' },
	{ id: 28, maskBit: 27, name: 'Anime-Pictures' },
	{ id: 29, maskBit: 28, name: 'e621' },
	{ id: 30, maskBit: 29, name: 'Idol Complex' },
	{ id: 31, maskBit: 30, name: 'BCY Illust' },
	{ id: 32, maskBit: 31, name: 'BCY Cosplay' },
	{ id: 33, maskBit: 32, name: 'PortalGraphics' },
	{ id: 34, maskBit: 33, name: 'DeviantArt' },
	{ id: 35, maskBit: 34, name: 'Pawoo' },
	{ id: 36, maskBit: 35, name: 'Madokami', sourceType: 'MANGA' },
	{ id: 37, maskBit: 36, name: 'MangaDex', sourceType: 'MANGA' },
	{ id: 38, maskBit: 37, name: 'H-Misc (E-Hentai)', sourceType: 'MANGA' },
	{ id: 39, maskBit: 38, name: 'ArtStation' },
	{ id: 40, maskBit: 39, name: 'FurAffinity' },
	{ id: 41, maskBit: 40, name: 'Twitter' },
	{ id: 42, maskBit: 41, name: 'Furry Network' },
	{ id: 43, maskBit: 42, name: 'Kemono' },
	{ id: 44, maskBit: 43, name: 'Skeb' },
] as const satisfies readonly TSauceNaoIndex[];

export const SAUCENAO_INDEXES_BY_ID: ReadonlyMap<number, TSauceNaoIndex> = new Map(
	SAUCENAO_INDEXES.map((index) => [index.id, index]),
);

export const DEFAULT_SAUCENAO_ENABLED_INDEX_IDS: number[] = [
	5, 6, 8, 9, 11, 12, 25, 26, 27, 28, 34, 39, 41, 44,
];

export const DEFAULT_SAUCENAO_MINIMUM_SIMILARITY = 70;
