import { z } from 'zod';

export const JikanAnimeImageSchema = z.object({
	image_url: z.string().nullable(),
	small_image_url: z.string().nullable(),
	large_image_url: z.string().nullable(),
});

export const JikanAnimeImagesSchema = z.object({
	jpg: JikanAnimeImageSchema,
	webp: JikanAnimeImageSchema,
});

export const JikanResourceSchema = z.object({
	mal_id: z.number(),
	type: z.string(),
	name: z.string(),
	url: z.string(),
});

export const JikanAnimeSchema = z.object({
	mal_id: z.number(),
	url: z.string(),
	images: JikanAnimeImagesSchema,
	title: z.string(),
	synopsis: z.string().nullable(),
	genres: z.array(JikanResourceSchema),
});

export const JikanPaginationSchema = z.object({
	last_visible_page: z.number(),
	has_next_page: z.boolean(),
	current_page: z.number().optional(),
	items: z
		.object({
			count: z.number(),
			total: z.number(),
			per_page: z.number(),
		})
		.optional(),
});

export const JikanAnimeSearchResponseSchema = z.object({
	pagination: JikanPaginationSchema,
	data: z.array(JikanAnimeSchema),
});

export type TJikanAnimeSearchResponse = z.infer<typeof JikanAnimeSearchResponseSchema>;

export type JikanAnimeSearchParams = {
	unapproved?: boolean;
	page?: number;
	limit?: number;
	q?: string;
	type?: 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music' | 'cm' | 'pv' | 'tv_special';
	score?: number;
	min_score?: number;
	max_score?: number;
	status?: 'airing' | 'complete' | 'upcoming';
	rating?: 'g' | 'pg' | 'pg13' | 'r17' | 'r' | 'rx';
	sfw?: boolean;
	genres?: string;
	genres_exclude?: string;
	order_by?:
		| 'mal_id'
		| 'title'
		| 'type'
		| 'rating'
		| 'start_date'
		| 'end_date'
		| 'episodes'
		| 'score'
		| 'scored_by'
		| 'rank'
		| 'popularity'
		| 'favorites'
		| 'members';
	sort?: 'desc' | 'asc';
	letter?: string;
	producers?: string;
	start_date?: string;
	end_date?: string;
};

export class JikanApi {
	static readonly BASE_URL = 'https://api.jikan.moe/v4';

	/**
	 * Search anime
	 * @see https://docs.api.jikan.moe/#/anime/getanimesearch
	 */
	static async searchAnime(params: JikanAnimeSearchParams): Promise<TJikanAnimeSearchResponse> {
		const queryParams = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				queryParams.append(key, String(value));
			}
		}

		const url = `${this.BASE_URL}/anime?${queryParams.toString()}`;
		const response = await fetch(url);

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(`Jikan API error: ${response.status} ${response.statusText} - ${errorBody}`);
		}

		const data = await response.json();
		return JikanAnimeSearchResponseSchema.parse(data);
	}
}
