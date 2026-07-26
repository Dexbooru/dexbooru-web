export type PostImageSimilarityMlResult = {
	post_id: string;
	image_url: string;
	similarity_score: number;
};

export type PostImageSimilarityResult = PostImageSimilarityMlResult & {
	createdAt: string;
	authorUsername: string | null;
	authorProfilePictureUrl: string | null;
};

export type PostImageSimilaritySearchResponse = {
	results: PostImageSimilarityMlResult[];
};
