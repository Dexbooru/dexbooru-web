import { ML_API_URL } from '../constants/urls';

export const getEstimatedPostRating = async (tags: string[]) => {
	const url = `${ML_API_URL}/api/tags/rating`;

	return await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			tags,
		}),
	});
};
