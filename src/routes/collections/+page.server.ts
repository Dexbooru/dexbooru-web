import { handleCreateCollection, handleGetCollections } from '$lib/server/controllers/collections';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';
import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
	default: async (event) => {
		return await handleCreateCollection(event, 'form-action');
	},
};

export const load: PageServerLoad = async (event) => {
	return (await handleGetCollections(event, 'page-server-load')) as TCollectionPaginationData;
};
