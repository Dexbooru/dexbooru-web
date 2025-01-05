import type { TPostPaginationData } from '$lib/shared/types/posts';
import { handleGetAdvancedPostSearchResults } from '../../lib/server/controllers/search';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return (await handleGetAdvancedPostSearchResults(
		event,
		'page-server-load',
	)) as TPostPaginationData;
};
