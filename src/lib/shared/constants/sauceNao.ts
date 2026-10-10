import type { TPostSourceType } from '../types/sauceNao';

export const SAUCENAO_INDEX_DETAILS_URL =
	'https://saucenao.com/tools/examples/api/index_details.txt';

export const DEFAULT_SAUCENAO_ENABLED_INDEX_IDS: number[] = [
	5, 6, 8, 9, 11, 12, 25, 26, 27, 28, 34, 39, 41, 44,
];

export const DEFAULT_SAUCENAO_MINIMUM_SIMILARITY = 70;

/** Home page for each SauceNAO index (ids from index_details.txt; #17 is reserved). */
export const SAUCENAO_INDEX_WEBSITE_BASE_URLS: ReadonlyMap<number, string> = new Map([
	[0, 'https://www.dlsite.com/home/maniax/'],
	[1, 'https://anidb.net/'],
	[2, 'https://www.dlsite.com/home/pro/'],
	[3, 'https://www.doujinshi.org/'],
	[4, 'https://www.doujinshi.org/'],
	[5, 'https://www.pixiv.net'],
	[6, 'https://www.pixiv.net'],
	[7, 'https://anidb.net/'],
	[8, 'https://seiga.nicovideo.jp'],
	[9, 'https://danbooru.donmai.us'],
	[10, 'https://drawr.net'],
	[11, 'https://nijie.info'],
	[12, 'https://yande.re'],
	[13, 'https://www.animelyrics.com/anime/openings/'],
	[14, 'https://www.imdb.com'],
	[15, 'https://www.shutterstock.com'],
	[16, 'https://www.fakku.net'],
	[18, 'https://nhentai.net'],
	[19, 'https://2d-market.com/en'],
	[20, 'https://medibang.com'],
	[21, 'https://anidb.net/'],
	[22, 'https://anidb.net/'],
	[23, 'https://www.imdb.com'],
	[24, 'https://www.thetvdb.com/'],
	[25, 'https://gelbooru.com'],
	[26, 'https://konachan.com'],
	[27, 'https://chan.sankakucomplex.com'],
	[28, 'https://anime-pictures.net'],
	[29, 'https://e621.net'],
	[30, 'https://idolcomplex.com'],
	[31, 'https://bcy.net'],
	[32, 'https://bcy.net'],
	[33, 'https://www.portalgraphics.net'],
	[34, 'https://www.deviantart.com'],
	[35, 'https://pawoo.net'],
	[36, 'https://manga.madokami.al'],
	[37, 'https://mangadex.org'],
	[38, 'https://e-hentai.org'],
	[39, 'https://www.artstation.com'],
	[40, 'https://www.furaffinity.net'],
	[41, 'https://x.com'],
	[42, 'https://www.furrynetwork.com'],
	[43, 'https://kemono.cr'],
	[44, 'https://skeb.jp'],
]);

export const getSauceNaoIndexWebsiteBaseUrl = (indexId: number): string | undefined =>
	SAUCENAO_INDEX_WEBSITE_BASE_URLS.get(indexId);

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
