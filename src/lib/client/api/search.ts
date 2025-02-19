import { buildUrl } from '$lib/client/helpers/urls';

export const getGlobalSearchResults = async (
	query: string,
	searchSection: 'all' | 'tags' | 'artists' | 'users' | 'collections' | 'posts' = 'all',
): Promise<Response> => {
	const searchUrl = buildUrl('/api/search', { query, searchSection });
	return await fetch(searchUrl);
};
