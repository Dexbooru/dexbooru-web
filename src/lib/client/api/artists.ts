import { buildUrl } from '$lib/client/helpers/urls';

export const getArtists = async (letter: string, pageNumber: number): Promise<Response> => {
	const finalUrl = buildUrl(`/api/artists/${letter}`, { pageNumber });
	return await fetch(finalUrl);
};
