import { handleGetUserCollections } from '$lib/server/controllers/collections';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return (await handleGetUserCollections(event, 'page-server-load')) as TCollectionPaginationData;
};
