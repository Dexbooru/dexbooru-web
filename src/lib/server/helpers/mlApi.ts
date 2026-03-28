import { DEXBOORU_ML_API_URL } from '$env/static/private';
import { DEFAULT_POST_IMAGE_SIMILARITY_TOP_K } from '$lib/shared/constants/postImageSimilarity';
import type { TSimilaritySearchMlRequest } from '../types/mlApi';

const SIMILARITY_POST_IMAGES_PATH = '/api/similarity/posts/images/';
const INDEX_POST_IMAGES_PATH = '/api/posts/index-images';

/**
 * Notify the ML service to index original-sized post images (similarity / embeddings).
 */
export const indexPostImages = async (postId: string, originalImageUrls: string[]) => {
	if (originalImageUrls.length === 0) {
		return new Response(null, { status: 204 });
	}
	const url = `${DEXBOORU_ML_API_URL}${INDEX_POST_IMAGES_PATH}`;
	return await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ post_id: postId, image_urls: originalImageUrls }),
	});
};

export const getHealthCheck = async () => {
	const url = `${DEXBOORU_ML_API_URL}/api/general/health-check`;
	return await fetch(url);
};

export const getSimilarPostsBySimilaritySearch = async (input: TSimilaritySearchMlRequest) => {
	const url = `${DEXBOORU_ML_API_URL}${SIMILARITY_POST_IMAGES_PATH}`;
	const topK = input.topClosestMatchCount ?? DEFAULT_POST_IMAGE_SIMILARITY_TOP_K;

	const form = new FormData();
	form.append('top_closest_match_count', String(topK));
	if (input.description) {
		form.append('description', input.description);
	}

	if (input.kind === 'image_url') {
		form.append('image_url', input.imageUrl);
	} else {
		const buf = Buffer.from(input.imageBytes);
		const file = new File([buf], input.filename, { type: input.contentType });
		form.append('image_file', file);
	}

	return await fetch(url, {
		method: 'POST',
		body: form,
	});
};
