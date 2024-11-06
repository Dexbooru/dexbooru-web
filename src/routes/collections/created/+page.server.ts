import { handleGetAuthenticatedUserCollections } from '$lib/server/controllers/collections';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return (await handleGetAuthenticatedUserCollections(event)) as TCollectionPaginationData;
};
