import { handleGetPostsByAuthor } from '$lib/server/controllers/posts';
import type { IPostPaginationData } from '$lib/shared/types/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return (await handleGetPostsByAuthor(event, 'page-server-load')) as IPostPaginationData & {
		author: string;
	};
};