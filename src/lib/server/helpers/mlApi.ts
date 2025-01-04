import { DEXBOORU_ML_API_URL } from '$env/static/private';
import { ORIGINAL_IMAGE_SUFFIX } from '$lib/shared/constants/images';
import type { TPostSimilarityBody } from '$lib/shared/types/posts';

export const getHealthCheck = async () => {
	const url = `${DEXBOORU_ML_API_URL}/api/general/health-check`;
	return await fetch(url);
};

export const indexPostImages = async (postId: string, imageUrls: string[]) => {
	try {
		const filteredImageUrls = imageUrls.filter(
			(imageUrl) => imageUrl.length > 0 && imageUrl.includes(ORIGINAL_IMAGE_SUFFIX),
		);
		const url = `${DEXBOORU_ML_API_URL}/api/posts/index/images`;
		const body = {
			post_id: postId,
			image_urls: filteredImageUrls,
		};

		return await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});
	} catch {
		return null;
	}
};

export const getSimilarPostsBySimilaritySearch = async (body: TPostSimilarityBody) => {
	const url = `${DEXBOORU_ML_API_URL}/api/posts/index/similarity`;

	return await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});
};
