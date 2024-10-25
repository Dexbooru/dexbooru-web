import { handleCreateCollection } from '$lib/server/controllers/collections';
import { handleGetPosts } from '$lib/server/controllers/posts';
import type { TPostPaginationData } from '$lib/shared/types/posts';
import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
	default: async (event) => {
		return await handleCreateCollection(event, 'form-action');
	},
};

export const load: PageServerLoad = async (event) => {
	return (await handleGetPosts(event, 'page-server-load', 'general')) as TPostPaginationData;
};
