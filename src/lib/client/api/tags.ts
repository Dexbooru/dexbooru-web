import { buildUrl } from '$lib/shared/helpers/urls';

export const getTags = async (letter: string, pageNumber: number): Promise<Response> => {
	const finalUrl = buildUrl(`/api/tags/${letter}`, { pageNumber });
	return await fetch(finalUrl);
};
