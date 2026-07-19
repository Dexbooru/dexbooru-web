export type PostImageSimilarityResult = {
	post_id: string;
	image_url: string;
	similarity_score: number;
};

export type PostImageSimilaritySearchResponse = {
	results: PostImageSimilarityResult[];
};
