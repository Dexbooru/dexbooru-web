/**
 * Response models from dexbooru-ai `POST /api/similarity/posts/images/`
 * (`PostImageSimilaritySearchResponse` / `PostImageSimilarityResult`).
 */
export type PostImageSimilarityResult = {
	post_id: string;
	image_url: string;
	/** Model similarity as percentage (0–100), per AI service. */
	similarity_score: number;
};

export type PostImageSimilaritySearchResponse = {
	results: PostImageSimilarityResult[];
};
