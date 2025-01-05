import { handleGetSimilarPosts } from '$lib/server/controllers/posts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		return await handleGetSimilarPosts(event, 'form-action');
	},
};
